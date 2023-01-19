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

import * as Error from "../utils/errors/http/index.js";

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
  async addUser(email, password, phoneNumber) {
    // Catch the error if the user already exists
    try {
      const params = {
        ClientId:
          this.app === "crm"
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
  async resendVerificationCode(email) {
    try {
      const params = {
        ClientId:
          this.app === "crm"
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
  async confirmUser(email, code) {
    try {
      const params = {
        ClientId:
          this.app === "crm"
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
   * @param {String} phoneNumber - User phone number.
   * @param {String} accessToken - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   *  @see https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerifyUserAttribute.html
   */
  async verifyUserPhoneNumber(accessToken, code) {
    try {
      const params = {
        AccessToken: accessToken,
        AttributeName: "phone_number",
        Code: code,
      };

      const response = await this.congito.verifyUserAttribute(params).promise();

      logger.info(
        "COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE VERIFY_USER_PHONE_NUMBER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   * Verifies the user email attribute in the Cognito service by confirming the confirmation code that was sent to the user email.
   *
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   * @see https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerifyUserAttribute.html
   */
  async verifyUserEmail(accessToken, code) {
    try {
      const params = {
        AccessToken: accessToken,
        AttributeName: "email",
        Code: code,
      };

      const response = await this.congito.verifyUserAttribute(params).promise();

      logger.info(
        "COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE VERIFY_USER_PHONE_NUMBER ERROR: " +
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
  async adminConfirmUser(email) {
    try {
      const params = {
        UserPoolId:
          this.app === "crm"
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
   * @description Sends a "forgot password" code to the user email. This is also used to resend the code.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async sendForgotPasswordCode(email) {
    try {
      const params = {
        ClientId:
          this.app === "crm"
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
   * @description Changes the user password in the Cognito service by confirming the "forgot password" code that was sent to the user email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async changeUserPasswordWithCode(email, code, password) {
    try {
      const params = {
        ClientId:
          this.app === "crm"
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
  async authenticateUser(authflow, payload) {
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
        ClientId:
          this.app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
      };

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
  async refreshUserToken(refreshToken) {
    try {
      const params = {
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId:
          this.app === "crm"
            ? AWS_COGNITO_CRM_CLIENT_ID
            : AWS_COGNITO_MARKETPLACE_CLIENT_ID,
        UserPoolId:
          this.app === "crm"
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
  async adminDeleteUser(username) {
    try {
      const params = {
        UserPoolId:
          this.app === "crm"
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

  async respondToAuthChallenge(challengeName, session, challengePayload) {
    try {
      const params = {
        ChallengeName: challengeName,
        ClientId:
          this.app === "crm"
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

  async getSession(accessToken) {
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

  async getUserRoles(username) {
    try {
      const params = {
        UserPoolId:
          this.app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
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
  async AddUserToGroup(username, groupName) {
    try {
      // Verify if the group exists in the following enum
      let groups = ["admin", "crm-user", "marketplace-user"];

      const params = {
        GroupName: groupName,
        UserPoolId:
          this.app === "crm"
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

  async addUserCustomAttribute(username, attributeName, attributeValue) {
    try {
      const params = {
        UserAttributes: [
          {
            Name: attributeName,
            Value: attributeValue,
          },
        ],
        UserPoolId:
          this.app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        Username: username,
      };

      /**
       * The attribute names are in the format "custom:attributeName"
       * Check if the attribute name is in the format "custom:attributeName" and if not add 'custom:' to the attribute name
       */
      if (!attributeName.startsWith("custom:")) {
        params.UserAttributes[0].Name = "custom:" + attributeName;
      }

      const response = await this.congito
        .adminUpdateUserAttributes(params)
        .promise();

      logger.info(
        "COGNITO SERVICE ADD_USER_CUSTOM_ATTRIBUTE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ADD_USER_CUSTOM_ATTRIBUTE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  async getUserCustomAttributes(username, attributes) {
    try {
      const params = {
        UserPoolId: AWS_COGNITO_CRM_USER_POOL_ID,
        Username: username,
      };

      /**
       * The attribute names are in the format "custom:attributeName"
       * Check if the attributes (from the param attributes) have the "custom:" prefix
       * If not, add it
       */
      if (attributes) {
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];

          if (!attribute.startsWith("custom:")) {
            attributes[i] = "custom:" + attribute;
          }
        }
      }

      let customAttributes = [];

      const response = await this.congito.adminGetUser(params).promise();

      /**
       * Check if the user has the attributes (from the param attributes) and add them to the customAttributes object
       */
      if (response.UserAttributes && attributes) {
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];
          const userAttribute = response.UserAttributes.find(
            (userAttribute) => userAttribute.Name === attribute
          );

          if (userAttribute) {
            customAttributes.push({
              name: userAttribute.Name,
              value: userAttribute.Value,
            });
          }
        }

        /**
         * If there is only one attribute, return the value instead of the object
         */
        if (customAttributes.length === 1) {
          customAttributes = customAttributes[0].value;
        }
      }

      logger.info(
        "COGNITO SERVICE GET_USER_CUSTOM_ATTRIBUTES SUCESS: " +
          JSON.stringify(customAttributes, null, 2) +
          "\n"
      );

      return customAttributes;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE GET_USER_CUSTOM_ATTRIBUTES ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }

  /**
   *
   * @param {*} username
   * @param {*} attributeName
   * @param {*} attributeValue
   * @returns
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminUpdateUserAttributes-property
   *
   * @example
   *
   * const Cognito = new CognitoService();
   * const verifyEmail = await cognitoService.adminUpdateUserAttribute("username", "email_verified", "true");
   * const verifyPhone = await cognitoService.adminUpdateUserAttribute("username", "phone_number_verified", "true");
   */
  async adminUpdateUserAttribute(username, attributeName, attributeValue) {
    try {
      const params = {
        UserAttributes: [
          {
            Name: attributeName,
            Value: attributeValue,
          },
        ],
        UserPoolId:
          this.app === "crm"
            ? AWS_COGNITO_CRM_USER_POOL_ID
            : AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
        Username: username,
      };

      const response = await this.congito
        .adminUpdateUserAttributes(params)
        .promise();

      logger.info(
        "COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE SUCESS: " +
          JSON.stringify(response, null, 2) +
          "\n"
      );

      return response;
    } catch (error) {
      logger.error(
        "COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }
}
