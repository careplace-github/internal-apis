import AWS from "aws-sdk";

import {
  AWS_cognito_crm_user_pool_id,
  AWS_cognito_crm_client_id,
  AWS_cognito_marketplace_user_pool_id,
  AWS_cognito_marketplace_client_id,
  AWS_cognito_region,
  AWS_cognito_identity_pool_id,
  AWS_access_key_id,
  AWS_secret_access_key,
} from "../../../config/constants/index.js";

// Import logger
import logger from "../../../logs/logger.js";

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: AWS_cognito_region,
  accessKeyId: AWS_access_key_id,
  secretAccessKey: AWS_secret_access_key,
});

/**
 * @class Class to manage the AWS Cognito service.
 */
export default class Cognito {
  /**
   * @description Creates a new user in the Cognito Service. The user receives an email with a confirmation code.
   * @param {string} app - Application name (crm or marketplace).
   * @param {string} userId - User id from the database.
   * @param {Object} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async addUser(app, email, password, phoneNumber) {
    // Catch the error if the user already exists
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        Password: password,
        Username: email,


        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },

          {
            Name: "phone_number",
            Value: phoneNumber,
          }
        ],
      };

      logger.info("APP NAME: " + app + "\n");

      let response = {};

      response = await cognito.signUp(params).promise();

      logger.info(
        "COGNITO SERVICE SIGN_UP SUCESS:" +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE SIGN_UP ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Send a confirmation code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async resendVerificationCode(app, email) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        Username: email,
      };

      let response = {};

      response = await cognito.resendConfirmationCode(params).promise();

      logger.info(
        "COGNITO SERVICE RESEND_VERIFICATION_CODE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE RESEND_VERIFICATION_CODE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  

  /**
   * @description Confirms the user  in the Cognito service by confirming the confirmation code that was sent either to the user email or phone number. Even if the code is sent to the user's phone number this function always takes the email as a parameter and the code to verify the user because the username in the Cognito is the email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async confirmUser(app, email, code) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,

        ConfirmationCode: code,
        Username: email,
      };
     

     const response = await cognito.confirmSignUp(params).promise();

      logger.info(
        "COGNITO SERVICE CONFIRM_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ERROR CONFIRM_USER: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }


  /**
   * @description Confirms the user phone number in the Cognito service by confirming the confirmation code that was sent to the user phone number.
   * @param {String} app - Application name (crm or marketplace).
   * @param {String} phoneNumber - User phone number.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async confirmUserPhoneNumber(app, phoneNumber, code) {

    try {
      const params = {
        AccessToken: code,
        AttributeName: "phone_number",
        AttributeValue: phoneNumber,
      };

      const response = await cognito.updateUserAttributes(params).promise();

      logger.info(
        "COGNITO SERVICE CONFIRM_USER_PHONE_NUMBER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE CONFIRM_USER_PHONE_NUMBER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }

  }

  /**
   * @description Confirms the user account in the Cognito service as an admin.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async adminConfirmUser(app, email) {
    try {
      const params = {
        UserPoolId:
          app === "crm"
            ? AWS_cognito_crm_user_pool_id
            : AWS_cognito_marketplace_user_pool_id,
        Username: email,
      };

      const cognitoResponse = await cognito
        .adminConfirmSignUp(params)
        .promise();

      logger.info(
        "COGNITO SERVICE ADMIN_CONFIRM_USER RESULT: " +
          JSON.stringify(cognitoResponse, null, 2) +
          "\n"
      );

      return cognitoResponse;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ADMIN_CONFIRM_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Sends a "forgot password" code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async sendForgotPasswordCode(app, email) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        Username: email,
      };

      let response = {};

      response.cognitoResponse = await cognito.forgotPassword(params).promise();
      response.message = "Cognito forgot password code sent successfully";

      logger.info(
        "COGNITO SERVICE SEND_FORGOT_PASSWORD_CODE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE SEND_FORGOT_PASSWORD_CODE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Resends a "forgot password" code to the user email.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async resendForgotPasswordCode(email) {
    try {
      // AWS Cognito doesn't have a resendForgotPasswordCode function, so we have to call the forgotPassword function again

      response = this.sendForgotPasswordCode(email);

      logger.info(
        "COGNITO SERVICE RESEND_FORGOT_PASSWORD_CODE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE RESEND_FORGOT_PASSWORD_CODE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Changes the user password in the Cognito service by confirming the "forgot password" code that was sent to the user email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async changeUserPasswordWithCode(app, email, code, password) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        ConfirmationCode: code,
        Password: password,
        Username: email,
      };

      let response = {};

      response.cognitoResponse = await cognito
        .confirmForgotPassword(params)
        .promise();
      response.message = "Cognito user password changed successfully";

      logger.info(
        "COGNITO SERVICE CHANGE_USER_PASSWORD_WITH_CODE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE CHANGE_USER_PASSWORD_WITH_CODE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Authenticates the user in the Cognito service.
   * @param {String} email - User email.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - JWT token.
   */
  static async authenticateUser(app, authflow, payload) {
    try {
      const params = {
        AuthFlow: authflow != null ? authflow : "USER_PASSWORD_AUTH",

        AuthParameters: {
          USERNAME: payload.email,
          PASSWORD: payload.password,
          REFRESH_TOKEN: payload.refreshToken,
        },

        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
      };

      logger.info("payload ", JSON.stringify(payload, null, 2));
      logger.info("params ", JSON.stringify(params, null, 2));

      const response = await cognito.initiateAuth(params).promise();

      logger.info(
        "COGNITO SERVICE AUTHENTICATE_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE AUTHENTICATE_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return {
        error: error,
      };
    }
  }

  /**
   * @debug
   * @description Changes the user password in the Cognito service.
   * @param {String} accessToken - User access token.
   * @param {String} oldPassword - Old password.
   * @param {String} newPassword - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async changeUserPassword(accessToken, oldPassword, newPassword) {
    try {
      let response = {};
      let authResponse = "access";

      const params = {
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      };

      response.cognitoResponse = await cognito.changePassword(params).promise();

      response.message = "Cognito user password changed successfully";

      logger.info(
        "COGNITO SERVICE CHANGE_USER_PASSWORD SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE CHANGE_USER_PASSWORD ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return {
        error: error,
      };
    }
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} refreshToken - User refresh token.
   * @returns {Promise<JSON>} - JWT token.
   */
  static async refreshUserToken(app, refreshToken) {
    try {
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        UserPoolId:
          app === "crm"
            ? AWS_cognito_crm_user_pool_id
            : AWS_cognito_marketplace_user_pool_id,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      let response = {};

      response.cognitoResponse = cognito.initiateAuth(params).promise();
      response.message = "Cognito user token refreshed successfully";

      logger.info(
        "COGNITO SERVICE REFRESH_USER_TOKEN SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE REFRESH_USER_TOKEN ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Logs out the user in the Cognito service.
   * @param {String} accessToken - User access token.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async logoutUser(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      let response = {};

      response.cognitoResponse = await cognito.globalSignOut(params).promise();
      response.message = "Cognito user logged out successfully";

      logger.info(
        "COGNITO SERVICE LOGOUT_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE LOGOUT_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} accessToken - User access token.
   * @returns {Promise<JSON>} - Cognito user details.
   */
  static async getUser(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      let response = {};

      response.cognitoResponse = await cognito.getUser(params).promise();
      response.message = "Cognito user details retrieved successfully";

      logger.info(
        "COGNITO SERVICE GET_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );
    } catch (error) {
      logger.error(
        "COGNITO SERVICE GET_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Updates the user attributes in the Cognito service.
   * @param {String} accessToken - User access token.
   * @param {String} attributes - Cognito user attributes.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async updateUser(accessToken, attributes) {
    try {
      const params = {
        AccessToken: accessToken,
        UserAttributes: attributes,
      };

      let response = {};

      response.cognitoResponse = await cognito
        .updateUserAttributes(params)
        .promise();
      response.message = "Cognito user updated successfully";

      logger.info(
        "COGNITO SERVICE UPDATE_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );
    } catch (error) {
      logger.error(
        "COGNITO SERVICE UPDATE_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Deletes the user in the Cognito service.
   * @param
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  static async adminDeleteUser(app, username) {
    try {
      const params = {
        UserPoolId:
          app === "crm"
            ? AWS_cognito_crm_user_pool_id
            : AWS_cognito_marketplace_user_pool_id,
        Username: username,
      };

      const response = await cognito.adminDeleteUser(params).promise();

      logger.info(
        "COGNITO SERVICE ADMIN_DELETE_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ADMIN_DELETE_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  static async respondToAuthChallenge(
    app,
    challengeName,
    session,
    challengePayload
  ) {
    try {
      const params = {
        ChallengeName: challengeName,
        ClientId:
          app === "crm"
            ? AWS_cognito_crm_client_id
            : AWS_cognito_marketplace_client_id,
        Session: session,
        ChallengeResponses: challengePayload,
      };

      let response = {};

      response.cognitoResponse = await cognito
        .respondToAuthChallenge(params)
        .promise();

      logger.info(
        "COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE RESULT: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  static async getSession(app, token) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      const cognitoResponse = await cognito.getUser(params).promise();

      logger.info(
        "COGNITO SERVICE GET_SESSION SUCESS: " +
          JSON.stringify(cognitoResponse, null, 2) +
          "\n"
      );

      return cognitoResponse;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE GET_SESSION ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }
}
