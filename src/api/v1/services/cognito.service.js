import AWS from "aws-sdk";

import {
  AWS_COGNITO_CRM_USER_POOL_ID,
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_REGION,
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
} from "../../../config/constants/index.js";

import * as Error from "../helpers/errors/errors.helper.js";

// Import logger
import logger from "../../../logs/logger.js";

/**
 * Creates a new Cognito instance
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html
 */
const CognitoClient = new AWS.CognitoIdentityServiceProvider({
  region: AWS_COGNITO_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACESS_KEY,
});

/**
 * Class to manage the AWS Cognito Service.
 */
export default class Cognito {
  /**
   * Constructor
   */
  constructor(app) {
    this.app = app;
    this.congito = CognitoClient;
  }

  /**
   * @description Creates a new user in the Cognito Service. The user receives an email with a confirmation code.
   * @param {string} app - Application name (crm or marketplace).
   * @param {string} userId - User id from the database.
   * @param {Object} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  async addUser(app, email, password, phoneNumber) {
    // Catch the error if the user already exists
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
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
          },
        ],
      };

      logger.info("APP NAME: " + app + "\n");

      let response = {};

      response = await this.congito.signUp(params).promise();

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
  async resendVerificationCode(app, email) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        Username: email,
      };

      let response = {};

      response = await this.congito.resendConfirmationCode(params).promise();

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
  async confirmUser(app, email, code) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,

        ConfirmationCode: code,
        Username: email,
      };

      const response = await this.congito.confirmSignUp(params).promise();

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
   * Verifies the user phone number attribute in the Cognito service by confirming the confirmation code that was sent to the user phone number.
   * @param {String} app - Application name (crm or marketplace).
   * @param {String} phoneNumber - User phone number.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   *  @see https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerifyUserAttribute.html
   */
  async verifyUserPhoneNumber(app, phoneNumber, code) {
    try {
      const params = {
        AccessToken: code,
        AttributeName: "phone_number",
        AttributeValue: phoneNumber,
      };

      const response = await this.congito
        .updateUserAttributes(params)
        .promise();

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
   * Verifies the user email attribute in the Cognito service by confirming the confirmation code that was sent to the user email.
   *
   * @param {String} app - Application name (crm or marketplace).
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   * @see https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerifyUserAttribute.html
   */
  async verifyUserEmail(app, email, code) {}

  /**
   * @description Confirms the user account in the Cognito service as an admin.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async adminConfirmUser(app, email) {
    try {
      const params = {
        UserPoolId:
          app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        Username: email,
      };

      const cognitoResponse = await this.congito
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
  async sendForgotPasswordCode(app, email) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        Username: email,
      };

      let response = {};

      response.cognitoResponse = await this.congito
        .forgotPassword(params)
        .promise();
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
  async resendForgotPasswordCode(email) {
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
  async changeUserPasswordWithCode(app, email, code, password) {
    try {
      const params = {
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        ConfirmationCode: code,
        Password: password,
        Username: email,
      };

      let response = {};

      response.cognitoResponse = await this.congito
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
      throw new Error._500(error.message);
    }
  }

  /**
   * @description Authenticates the user in the Cognito service.
   * @param {String} email - User email.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - JWT token.
   *
   * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html
   */
  async authenticateUser(app, authflow, payload) {
    try {
      const params = {
        AuthFlow: authflow != null ? authflow : "USER_PASSWORD_AUTH",

        AuthParameters: {
          USERNAME: payload.email,
          PASSWORD: payload.password,
          REFRESH_TOKEN: payload.refreshToken,
        },

        /**
         * app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
         */
        ClientId: AWS_COGNITO_CRM_CLIENT_ID,
      };

      logger.info(`APP: ${app}`);
      logger.info(`AUTHFLOW: ${authflow}`);
      logger.info(`PAYLOAD: ${JSON.stringify(payload)}`);
      logger.info(`PARAMS: ${JSON.stringify(params)}`);
      logger.info(`CLIENTID: ${params.ClientId}`);
      logger.info(`USERNAME: ${params.AuthParameters.USERNAME}`);
      logger.info(`PASSWORD ${params.AuthParameters.PASSWORD}`);
      logger.info(`REFRESH_TOKEN ${params.AuthParameters.REFRESH_TOKEN}`);
      logger.info(`CLIENTID ${params.ClientId}`);

      const response = await this.congito.initiateAuth(params).promise();

      logger.info(
        "COGNITO SERVICE AUTHENTICATE_USER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(`Error: ${error.message}`);
      return error;
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
  async changeUserPassword(accessToken, oldPassword, newPassword) {
    try {
      let response = {};
      let authResponse = "access";

      const params = {
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      };

      response.cognitoResponse = await this.congito
        .changePassword(params)
        .promise();

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
  async refreshUserToken(app, refreshToken) {
    try {
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        UserPoolId:
          app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      let response = {};

      response.cognitoResponse = this.congito.initiateAuth(params).promise();
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
  async logoutUser(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      let response = {};

      response.cognitoResponse = await this.congito
        .globalSignOut(params)
        .promise();
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
  async getUser(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      let response = {};

      response.cognitoResponse = await this.congito.getUser(params).promise();
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
  async updateUser(accessToken, attributes) {
    try {
      const params = {
        AccessToken: accessToken,
        UserAttributes: attributes,
      };

      let response = {};

      response.cognitoResponse = await this.congito
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
  async adminDeleteUser(app, username) {
    try {
      const params = {
        UserPoolId:
          app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        Username: username,
      };

      const response = await this.congito.adminDeleteUser(params).promise();

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

  async respondToAuthChallenge(app, challengeName, session, challengePayload) {
    try {
      const params = {
        ChallengeName: challengeName,
        ClientId:
          app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        Session: session,
        ChallengeResponses: challengePayload,
      };

      let response = {};

      response.cognitoResponse = await this.congito
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

  async getSession(app, token) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      const cognitoResponse = await this.congito.getUser(params).promise();

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

  async getUserRoles(app, username) {
    try {
      const params = {
        UserPoolId: AWS_COGNITO_CRM_USER_POOL_ID,
        Username: username,
      };

      const cognitoResponse = await this.congito
        .adminListGroupsForUser(params)
        .promise();

      logger.info(
        "COGNITO SERVICE GET_USER_ROLES SUCESS: " +
          JSON.stringify(cognitoResponse, null, 2) +
          "\n"
      );

      return cognitoResponse;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE GET_USER_ROLES ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * Adds a user to a group
   *
   * @param {String} app - Application name (crm, marketplace)
   * @param {*} username - Username
   * @param {*} groupName - Group name
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminAddUserToGroup-property
   */
  async AddUserToGroup(app, username, groupName) {
    try {
      // Verify if the group exists in the following enum
      let groups = ["admin", "crm-user", "marketplace-user"];

      const params = {
        GroupName: groupName,
        UserPoolId:
          app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        Username: username,
      };

      const response = await this.congito.adminAddUserToGroup(params).promise();

      logger.info(
        "COGNITO SERVICE ADD_USER_TO_GROUP SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ADD_USER_TO_GROUP ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }
}
