// aws
import AWS, { CognitoIdentityServiceProvider } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

// @api
import { LayerError } from '@api/v1/utils';

// @constants
import {
  AWS_COGNITO_BUSINESS_USER_POOL_ID,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_REGION,
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
} from '@constants';
// @logger
import logger from '@logger';

/**
 * Creates a new Cognito instance
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html
 */
const CognitoClient: CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: AWS_COGNITO_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACESS_KEY,
});

// ------------------------------------------------------------------------ //

interface CognitoParams {
  ClientId: string;
  Username: string;
}

// ------------------------------------------------------------------------ //

/**
 * Class to manage the AWS Cognito Service.
 */
export default class CognitoService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;
  private userPoolId: string;

  /**
   * Constructor
   */
  constructor(clientId: string) {
    this.cognito = CognitoClient;
    this.clientId = clientId;
    this.userPoolId =
      this.clientId === AWS_COGNITO_BUSINESS_CLIENT_ID
        ? AWS_COGNITO_BUSINESS_USER_POOL_ID
        : AWS_COGNITO_MARKETPLACE_USER_POOL_ID;
  }

  /**
   * @description Creates a new user in the Cognito Service. The user receives an email with a confirmation code.
   * @param {string} email - Email of the user.
   * @param {string} password - Password of the user.
   * @param {string} phoneNumber - Phone number of the user.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  async addUser(
    email: string,
    password: string,
    phoneNumber: string
  ): Promise<CognitoIdentityServiceProvider.SignUpResponse> {
    logger.info(`
    Cognito Service ADD_USER Request: \n
    email: ${email} \n
    password: ${password} \n
    phoneNumber: ${phoneNumber} \n
    `);

    const params: CognitoIdentityServiceProvider.Types.SignUpRequest = {
      ClientId: this.clientId,
      Password: password,
      Username: email,

      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },

        {
          Name: 'phone_number',
          Value: phoneNumber,
        },
      ],
    };

    let response: CognitoIdentityServiceProvider.Types.SignUpResponse;

    try {
      response = await this.cognito.signUp(params).promise();
    } catch (error: any) {
      logger.error(`Cognito Service ADD_USER Error: \n
      ${JSON.stringify(error, null, 2)} \n`);

      switch (error.code) {
        case 'UsernameExistsException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'InvalidPasswordException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
    Cognito Service ADD_USER Response: \n
    ${JSON.stringify(response, null, 2)} \n`);

    return response;
  }

  /**
   * @description Send a confirmation code to the user. For the BUSINESS users the code is sent to the user email and for the Marketplace users the code is sent to the user phone number.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   * @throws {LayerError.INVALID_PARAMETER} - If the user does not exist in the Cognito service.
   */
  async sendConfirmationCode(email: string): Promise<any> {
    logger.info(`Cognito Service SEND_CONFIRMATION_CODE Request: \n email: ${email} \n`);

    const params: CognitoParams = {
      ClientId: this.clientId,
      Username: email,
    };

    let response = {};

    /**
     * Check if the user exists in the Cognito service.
     *
     * We pay for email and SMS notifications so we want to avoid sending notifications to users that do not exist in the Cognito service.
     */
    try {
      let userExists = await this.adminGetUser(email);
    } catch (error: any) {
      if (error.type === 'NOT_FOUND') {
        throw new LayerError.NOT_FOUND(error.message);
      } else {
        throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    try {
      response = await this.cognito.resendConfirmationCode(params).promise();
    } catch (error: any) {
      if (error.code === 'UserNotFoundException') {
        throw new LayerError.INVALID_PARAMETER(error.message);
      } else {
        throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      `Cognito Service SEND_CONFIRMATION_CODE Response: \n ${JSON.stringify(response, null, 2)} \n`
    );

    return response;
  }

  /**
   * @description Confirms the user  in the Cognito service by confirming the confirmation code that was sent either to the user email or phone number. Even if the code is sent to the user's phone number this function always takes the email as a parameter and the code to verify the user because the username in the Cognito is the email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async confirmUser(email, code) {
    logger.info(`Cogito Service CONFIRM_USER Request: \n email: ${email} \n code: ${code} \n`);

    const params = {
      ClientId: this.clientId,

      ConfirmationCode: code,
      Username: email,
    };
    let response;

    try {
      response = await this.cognito.confirmSignUp(params).promise();
    } catch (error: any) {
      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'CodeMismatchException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`Cogito Service CONFIRM_USER Response: \n ${JSON.stringify(response, null, 2)} \n`);

    return response;
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
        AttributeName: 'phone_number',
        Code: code,
      };

      const response = await this.cognito.verifyUserAttribute(params).promise();

      logger.info(
        'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: ' +
          JSON.stringify(response, null, 2) +
          '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER ERROR: ' + JSON.stringify(error, null, 2) + '\n'
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
  async verifyUserEmail(
    accessToken: string,
    code: string
  ): Promise<
    PromiseResult<CognitoIdentityServiceProvider.VerifyUserAttributeResponse, AWS.AWSError>
  > {
    try {
      const params = {
        AccessToken: accessToken,
        AttributeName: 'email',
        Code: code,
      };

      const response = await this.cognito.verifyUserAttribute(params).promise();

      logger.info(
        'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: ' +
          JSON.stringify(response, null, 2) +
          '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
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
        UserPoolId: this.userPoolId,
        Username: email,
      };

      const cognitoResponse = await this.cognito.adminConfirmSignUp(params).promise();

      logger.info(
        'COGNITO SERVICE ADMIN_CONFIRM_USER RESULT: ' +
          JSON.stringify(cognitoResponse, null, 2) +
          '\n'
      );

      return cognitoResponse;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE ADMIN_CONFIRM_USER ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      return { error: error };
    }
  }

  /**
   * Sends a "forgot password" code to the user.
   * For the Marketplace users it sends the code to the user phone number.
   * For the BUSINESS users it sends the code to the user email.
   * This is also used to resend the code.
   *
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   * @throws {LayerError.NOT_FOUND} - If the user is not found.
   *
   * @see https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_ForgotPassword.html
   */
  async sendForgotPasswordCode(email) {
    logger.info(`Cognito Service SEND_FORGOT_PASSWORD_CODE Request: ${email}`);

    const params = {
      ClientId: this.clientId,
      Username: email,
    };

    let cognitoResponse;

    try {
      cognitoResponse = await this.cognito.forgotPassword(params).promise();
    } catch (error: any) {
      logger.info(
        `Cognito Service SEND_FORGOT_PASSWORD_CODE Error: ${JSON.stringify(error, null, 2)}`
      );

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
      Cognito Service SEND_FORGOT_PASSWORD_CODE Response: ${JSON.stringify(
        cognitoResponse,
        null,
        2
      )}`);

    return cognitoResponse;
  }

  /**
   * @description Changes the user password in the Cognito service by confirming the "forgot password" code that was sent to the user email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @param {String} password - New password.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async changeUserPasswordWithCode(email, code, password) {
    logger.info(
      `Cognito Service CHANGE_USER_PASSWORD_WITH_CODE Request: ${JSON.stringify(
        { email, code, password },
        null,
        2
      )}`
    );

    const params = {
      ClientId: this.clientId,
      ConfirmationCode: code,
      Password: password,
      Username: email,
    };

    let response = {};

    try {
      response = await this.cognito.confirmForgotPassword(params).promise();
    } catch (error: any) {
      logger.info(
        `Cognito Service CHANGE_USER_PASSWORD_WITH_CODE Error: ${JSON.stringify(error, null, 2)}`
      );

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'ExpiredCodeException':
          throw new LayerError.INVALID_CODE(error.message);

        case 'CodeMismatchException':
          throw new LayerError.INVALID_CODE(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
        Cognito Service CHANGE_USER_PASSWORD_WITH_CODE Response: ${JSON.stringify(
          response,
          null,
          2
        )}`);

    return response;
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
    const params = {
      AuthFlow: authflow != null ? authflow : 'USER_PASSWORD_AUTH',

      AuthParameters: {
        USERNAME: payload.email,
        PASSWORD: payload.password,
        REFRESH_TOKEN: payload.refreshToken,
      },

      ClientId: this.clientId,
    };
    let response;

    try {
      response = await this.cognito.initiateAuth(params).promise();
    } catch (error: any) {
      logger.error(
        'Cognito Service AUTHENTICATE_USER Error: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'NotAuthorizedException':
          throw new LayerError.UNAUTHORIZED(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'UserNotConfirmedException':
          throw new LayerError.UNAUTHORIZED(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE AUTHENTICATE_USER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
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
    logger.info(`
      Cognito Service CHANGE_USER_PASSWORD Request: ${JSON.stringify(
        { accessToken, oldPassword, newPassword },
        null,
        2
      )}
    `);

    let response = {};

    let cognitoResponse;
    const params = {
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    };

    try {
      cognitoResponse = await this.cognito.changePassword(params).promise();
    } catch (error: any) {
      logger.info(`
        Cognito Service CHANGE_USER_PASSWORD Error: ${JSON.stringify(error, null, 2)}
      `);

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'NotAuthorizedException':
          throw new LayerError.UNAUTHORIZED(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'LimitExceededException':
          throw new LayerError.ATTEMPT_LIMIT(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
      Cognito Service CHANGE_USER_PASSWORD Response: ${JSON.stringify(cognitoResponse, null, 2)}
    `);

    return response;
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} refreshToken - User refresh token.
   * @returns {Promise<JSON>} - JWT token.
   */
  async refreshUserToken(refreshToken) {
    try {
      const params = {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        UserPoolId: this.userPoolId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      let response: any = {};

      response.cognitoResponse = this.cognito.initiateAuth(params).promise();
      response.message = 'Cognito user token refreshed successfully';

      logger.info(
        'COGNITO SERVICE REFRESH_USER_TOKEN SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE REFRESH_USER_TOKEN ERROR: ' + JSON.stringify(error, null, 2) + '\n'
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
    logger.info(`
        Cognito Service LOGOUT_USER Request: \n ${JSON.stringify(accessToken, null, 2)}`);

    const params = {
      AccessToken: accessToken,
    };

    let response;

    try {
      response = await this.cognito.globalSignOut(params).promise();
    } catch (error: any) {
      logger.error('Cognito Service LOGOUT_USER Error: ' + JSON.stringify(error, null, 2) + '\n');

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'NotAuthorizedException':
          throw new LayerError.UNAUTHORIZED(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`Cognito Service LOGOUT_USER Response: ${JSON.stringify(response, null, 2)}`);

    return response;
  }

  /**
   * Returns the user details from the Cognito service as an admin.
   * @param {String} username - Username of the user.
   * @returns {Promise<ICognitoUser>} - Cognito user details.
   */
  async adminGetUser(username) {
    logger.info(`Cognito Service ADMIN_GET_USER Request: \n ${JSON.stringify(username, null, 2)}`);

    const params = {
      UserPoolId: this.userPoolId,
      Username: username,
    };

    let response;
    try {
      response = await this.cognito.adminGetUser(params).promise();
    } catch (error: any) {
      console.log(error);
      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'NotAuthorizedException':
          throw new LayerError.UNAUTHORIZED(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    return response;
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

      let response: any = {};

      response.cognitoResponse = await this.cognito.updateUserAttributes(params).promise();
      response.message = 'Cognito user updated successfully';

      logger.info(
        'COGNITO SERVICE UPDATE_USER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
      );
    } catch (error: any) {
      logger.error('COGNITO SERVICE UPDATE_USER ERROR: ' + JSON.stringify(error, null, 2) + '\n');

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
        UserPoolId: this.userPoolId,
        Username: username,
      };

      const response = await this.cognito.adminDeleteUser(params).promise();

      logger.info(
        'COGNITO SERVICE ADMIN_DELETE_USER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE ADMIN_DELETE_USER ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      return { error: error };
    }
  }

  async respondToAuthChallenge(challengeName, session, challengePayload) {
    try {
      const params = {
        ChallengeName: challengeName,
        ClientId: this.clientId,
        Session: session,
        ChallengeResponses: challengePayload,
      };

      let response: any = {};

      response.cognitoResponse = await this.cognito.respondToAuthChallenge(params).promise();

      logger.info(
        'COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE RESULT: ' +
          JSON.stringify(response, null, 2) +
          '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      return { error: error };
    }
  }

  async getSession(accessToken) {
    try {
      const params = {
        AccessToken: accessToken,
      };

      const cognitoResponse = await this.cognito.getUser(params).promise();

      logger.info(
        'COGNITO SERVICE GET_SESSION SUCESS: ' + JSON.stringify(cognitoResponse, null, 2) + '\n'
      );

      return cognitoResponse;
    } catch (error: any) {
      logger.error('COGNITO SERVICE GET_SESSION ERROR: ' + JSON.stringify(error, null, 2) + '\n');

      return { error: error };
    }
  }

  async getUserRoles(username) {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: username,
      };

      const cognitoResponse = await this.cognito.adminListGroupsForUser(params).promise();

      logger.info(
        'COGNITO SERVICE GET_USER_ROLES SUCESS: ' + JSON.stringify(cognitoResponse, null, 2) + '\n'
      );

      return cognitoResponse;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE GET_USER_ROLES ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      return { error: error };
    }
  }

  /**
   * Adds a user to a group
   *
   * @param {String} app - Application name (business, marketplace)
   * @param {*} username - Username
   * @param {*} groupName - Group name
   * @returns {Promise<JSON>} - AWS Cognito response.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminAddUserToGroup-property
   */
  async addUserToGroup(username, groupName) {
    logger.info(
      `Cognito Service ADD_USER_TO_GROUP Request: \n ${JSON.stringify(
        { username, groupName },
        null,
        2
      )} \n`
    );

    // Verify if the group exists in the following enum
    let groups = ['admin', 'business-user', 'marketplace-user'];

    let response;

    if (!groups.includes(groupName)) {
      throw new LayerError.INVALID_PARAMETER(`Invalid group name: ${groupName}`);
    }

    const params = {
      GroupName: groupName,
      UserPoolId: this.userPoolId,
      Username: username,
    };

    try {
      response = await this.cognito.adminAddUserToGroup(params).promise();
    } catch (error: any) {
      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'GroupNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'NotAuthorizedException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE ADD_USER_TO_GROUP SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
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
        UserPoolId: this.userPoolId,
        Username: username,
      };

      /**
       * The attribute names are in the format "custom:attributeName"
       * Check if the attribute name is in the format "custom:attributeName" and if not add 'custom:' to the attribute name
       */
      if (!attributeName.startsWith('custom:')) {
        params.UserAttributes[0].Name = 'custom:' + attributeName;
      }

      const response = await this.cognito.adminUpdateUserAttributes(params).promise();

      logger.info(
        'COGNITO SERVICE ADD_USER_CUSTOM_ATTRIBUTE SUCESS: ' +
          JSON.stringify(response, null, 2) +
          '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE ADD_USER_CUSTOM_ATTRIBUTE ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      return { error: error };
    }
  }

  async getUserCustomAttribute(username, attributeName) {
    const params = {
      UserPoolId: AWS_COGNITO_BUSINESS_USER_POOL_ID,
      Username: username,
    };

    /**
     * The attribute name is in the format "custom:attributeName"
     * Check if the attributes (from the param attributes) have the "custom:" prefix
     * If not, add it
     */
    if (!attributeName.startsWith('custom:')) {
      attributeName = 'custom:' + attributeName;
    }

    let customAttribute;

    const response = await this.cognito.adminGetUser(params).promise();

    /**
     * Check if the user has the attribute
     */
    if (response.UserAttributes) {
      customAttribute = response.UserAttributes.filter(
        (attribute) => attribute.Name === attributeName
      );
    }

    // Return the attribute value

    logger.info(
      'COGNITO SERVICE GET_USER_CUSTOM_ATTRIBUTES SUCESS: ' +
        JSON.stringify(customAttribute, null, 2) +
        '\n'
    );

    return customAttribute[0].Value;
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
        UserPoolId: this.userPoolId,
        Username: username,
      };

      const response = await this.cognito.adminUpdateUserAttributes(params).promise();

      logger.info(
        'COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE SUCESS: ' +
          JSON.stringify(response, null, 2) +
          '\n'
      );

      return response;
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE ERROR: ' +
          JSON.stringify(error, null, 2) +
          '\n'
      );

      return { error: error };
    }
  }
}
