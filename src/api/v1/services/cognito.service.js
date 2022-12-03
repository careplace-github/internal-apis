import AWS from "aws-sdk";

import {
  AWS_cognito_user_pool_id,
  AWS_cognito_client_id,
  AWS_cognito_region,
  AWS_cognito_identity_pool_id,
  AWS_cognito_access_key_id,
  AWS_cognito_secret_access_key,
} from "../../../config/constants/index.js";

// Import logger
import logger from "../../../logs/logger.js";

// Class to manage the AWS Cognito service

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: AWS_cognito_region,
  accessKeyId: AWS_cognito_access_key_id,
  secretAccessKey: AWS_cognito_secret_access_key,
});

/**
 * @class Class to manage the AWS Cognito service.
 */
export default class Cognito {
  /**
   * @description Creates a new user in the Cognito Service. The user receives an email with a confirmation code.
   * @param {*} userId - User id from the database.
   * @param {*} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async addUser(email, password) {
    const params = {
      ClientId: AWS_cognito_client_id,
      // UserPoolId: AWS_cognito_user_pool_id,
      Password: password,
      Username: email,

      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    };

    // Catch the error if the user already exists
    try {
      const response = await cognito.signUp(params).promise();
      return response;
    } catch (error) {
      if (error.code === "UsernameExistsException") {
        logger.error("ERROR SIGN_UP: " + JSON.stringify(error));
        return {
          statusCode: 400,
          error: error.message || JSON.stringify(error),
        };
      } else {
        logger.error("ERROR SIGN_UP: " + JSON.stringify(error));
        return {
          statusCode: 500,
          error: error.message || JSON.stringify(error),
        };
      }
    }
  }

  /**
   * @description Resends a confirmation code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async resendConfirmationCode(email) {
    const params = {
      ClientId: AWS_cognito_client_id,
      Username: email,
    };

    const response = await cognito.resendConfirmationCode(params).promise();

    return response;
  }

  /**
   * @description Confirms the user email in the Cognito service by confirming the confirmation code that was sent to the user email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async confirmUser(email, code) {
    const params = {
      ClientId: AWS_cognito_client_id,

      ConfirmationCode: code,
      Username: email,
    };

    const response = await cognito.confirmSignUp(params).promise();

    return response;
  }

  /**
   * @description Sends a "forgot password" code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async sendForgotPasswordCode(email) {
    const params = {
      ClientId: AWS_cognito_client_id,
      Username: email,
    };

    return cognito.forgotPassword(params).promise();
  }

  /**
   * @description Resends a "forgot password" code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async resendForgotPasswordCode(email) {
    // AWS Cognito doesn't have a resendForgotPasswordCode function, so we have to call the forgotPassword function again
    this.sendForgotPasswordCode(email);
  }

  /**
   * @description Changes the user password in the Cognito service by confirming the "forgot password" code that was sent to the user email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async changeUserPasswordWithCode(email, code, password) {
    const params = {
      ClientId: AWS_cognito_client_id,
      ConfirmationCode: code,
      Password: password,
      Username: email,
    };

    const response = await cognito.confirmForgotPassword(params).promise();

    return response;
  }

  /**
   * @description Authenticates the user in the Cognito service.
   * @param {String} email - User email.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - JWT token.
   */
  static async authenticateUser(email, password) {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",

      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },

      ClientId: AWS_cognito_client_id,
    };

    try {
      const response = await cognito.initiateAuth(params).promise();

      return response;
    } catch (error) {
      logger.error("ERROR AUTHENTICATE_USER: " + JSON.stringify(error));
      return {
        statusCode: 500,
        error: error.message || JSON.stringify(error),
      };
    }
  }

  /**
   * @description Changes the user password in the Cognito service.
   * @param {String} accessToken - User access token.
   * @param {String} oldPassword - Old password.
   * @param {String} newPassword - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async changeUserPassword(accessToken, oldPassword, newPassword) {
    try {
      const test = await this.getUserDetails(accessToken);
      console.log("TESTE: " + JSON.stringify(test));

      const user = await this.getUserDetails(accessToken);

      console.log("User email: " + user.Username);

      // First we need to authenticate the user with the old password
      const authResponse = await this.authenticateUser(
        user.Username,
        oldPassword
      );
    } catch (error) {
      if (error.code === "NotAuthorizedException") {
        return {
          statusCode: 400,
          error: error.message || JSON.stringify(error),
        };
      } else {
        return {
          statusCode: 500,
          error: error.message || JSON.stringify(error),
        };
      }
    }

    try {
      // Then we can change the password
      const params = {
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      };

      const response = await cognito.changePassword(params).promise();
      return response;
    } catch (error) {
      if (error.code === "InvalidParameterException") {
        return {
          statusCode: 400,
          error: error.message || JSON.stringify(error),
        };
      } else {
        return {
          statusCode: 500,
          error: error.message || JSON.stringify(error),
        };
      }
    }
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} refreshToken - User refresh token.
   * @returns {Promise<JSON>} - JWT token.
   */
  static async refreshUserToken(refreshToken) {
    const params = {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: AWS_cognito_client_id,
      UserPoolId: AWS_cognito_user_pool_id,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    return cognito.initiateAuth(params).promise();
  }

  /**
   * @description Logs out the user in the Cognito service.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async logoutUser() {
    const params = {
      AccessToken: accessToken,
    };

    const response = cognito.globalSignOut(params).promise();

    return response;
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} accessToken - User access token.
   * @returns {Promise<JSON>} - Cognito user details.
   */
  static async getUser(accessToken) {
    const params = {
      AccessToken: accessToken,
    };

    return cognito.getUser(params).promise();
  }

  /**
   * @description Updates the user attributes in the Cognito service.
   * @param {String} accessToken - User access token.
   * @param {String} attributes - Cognito user attributes.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async updateUser(accessToken, attributes) {
    const params = {
      AccessToken: accessToken,
      UserAttributes: attributes,
    };

    return cognito.updateUserAttributes(params).promise();
  }

  /**
   * @description Deletes the user in the Cognito service.
   * @param {String} accessToken - User access token..
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async deleteUser(accessToken) {
    const params = {
      AccessToken: accessToken,
    };

    const response = await cognito.deleteUser(params).promise();

    return response;
  }
}
