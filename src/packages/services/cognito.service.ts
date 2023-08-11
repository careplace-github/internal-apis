// aws
import AWS, { CognitoIdentityServiceProvider } from 'aws-sdk';

import crypto from 'crypto';

// @api
import { LayerError } from '@utils';

// @constants
import {
  AWS_COGNITO_BUSINESS_USER_POOL_ID,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_USER_POOL_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_ADMIN_CLIENT_ID,
  AWS_COGNITO_ADMIN_USER_POOL_ID,
  AWS_COGNITO_REGION,
  AWS_COGNITO_IDENTITY_POOL_ID,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
  AWS_COGNITO_ISSUER,
  AWS_COGNITO_MARKETPLACE_CLIENT_SECRET,
  AWS_COGNITO_BUSINESS_CLIENT_SECRET,
  AWS_COGNITO_ADMIN_CLIENT_SECRET,
} from '@constants';
// @types
import { TClientID } from '@interfaces';
// @logger
import logger from '@logger';

// FIXME Use custom LayerError error handling
// FIXME Check the Stripe Error Api Response and update the error handling accordingly
// TODO Add request logging
// TODO Add response logging

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

/**
 * Class to manage the AWS Cognito Service.
 */
export default class CognitoService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;
  private userPoolId: string;
  private issuer: string;
  private clientSecret: string;

  /**
   * Constructor
   */
  constructor(clientId: TClientID) {
    this.cognito = CognitoClient;
    this.clientId = clientId;
    this.userPoolId =
      this.clientId === AWS_COGNITO_BUSINESS_CLIENT_ID
        ? AWS_COGNITO_BUSINESS_USER_POOL_ID
        : this.clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID
        ? AWS_COGNITO_MARKETPLACE_USER_POOL_ID
        : AWS_COGNITO_ADMIN_USER_POOL_ID;
    this.issuer = AWS_COGNITO_ISSUER;
    this.clientSecret =
      this.clientId === AWS_COGNITO_BUSINESS_CLIENT_ID
        ? AWS_COGNITO_BUSINESS_CLIENT_SECRET
        : this.clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID
        ? AWS_COGNITO_MARKETPLACE_CLIENT_SECRET
        : AWS_COGNITO_ADMIN_CLIENT_SECRET;
  }

  calculateSecretHash(username: string) {
    logger.info('CLIENT SECRET: ' + this.clientSecret);

    const message = username + this.clientId;
    const hmac = crypto.createHmac('sha256', this.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
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
      SecretHash: this.calculateSecretHash(email),

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
          throw new LayerError.DUPLICATE_KEY(error.message);

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

  async updateUserAttributes(
    Username: string,
    userAttributes: CognitoIdentityServiceProvider.Types.AttributeListType
  ): Promise<CognitoIdentityServiceProvider.Types.AdminUpdateUserAttributesResponse> {
    logger.info(
      `Cognito Service UPDATE_USER_ATTRIBUTES Request: \n Username: ${Username} \n Attributes: ${JSON.stringify(
        userAttributes,
        null,
        2
      )} \n`
    );

    let response: CognitoIdentityServiceProvider.Types.AdminUpdateUserAttributesResponse;

    let params: CognitoIdentityServiceProvider.Types.AdminUpdateUserAttributesRequest = {
      UserAttributes: userAttributes,
      UserPoolId: this.userPoolId,
      Username,
    };

    try {
      response = await this.cognito.adminUpdateUserAttributes(params).promise();
    } catch (error: any) {
      logger.error(`Cognito Service UPDATE_USER_ATTRIBUTES Error: \n
      ${JSON.stringify(error, null, 2)} \n`);

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
    Cognito Service UPDATE_USER_ATTRIBUTES Response: \n
    ${JSON.stringify(response, null, 2)} \n`);

    return response;
  }

  /**
   * @description Send a confirmation code to the user. For the BUSINESS users the code is sent to the user email and for the Marketplace users the code is sent to the user phone number.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   * @throws {LayerError.INVALID_PARAMETER} - If the user does not exist in the Cognito service.
   */
  async sendConfirmationCode(
    email: string
  ): Promise<CognitoIdentityServiceProvider.ResendConfirmationCodeResponse> {
    logger.info(`Cognito Service SEND_CONFIRMATION_CODE Request: \n email: ${email} \n`);

    const params: CognitoIdentityServiceProvider.Types.ResendConfirmationCodeRequest = {
      ClientId: this.clientId,
      Username: email,
      SecretHash: this.calculateSecretHash(email),
    };

    let response: CognitoIdentityServiceProvider.ResendConfirmationCodeResponse;

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

  async sendUserAttributeVerificationCode(
    accessToken: string,
    attributeName: 'email' | 'phone_number'
  ): Promise<CognitoIdentityServiceProvider.Types.GetUserAttributeVerificationCodeResponse> {
    logger.info(
      `Cognito Service GET_USER_ATTRIBUTE_VERIFICATION_CODE Request: \n Attribute: ${attributeName} \n`
    );

    const params: CognitoIdentityServiceProvider.Types.GetUserAttributeVerificationCodeRequest = {
      AccessToken: accessToken,
      AttributeName: attributeName,
    };

    let response: CognitoIdentityServiceProvider.Types.GetUserAttributeVerificationCodeResponse;

    try {
      response = await this.cognito.getUserAttributeVerificationCode(params).promise();
    } catch (error: any) {
      logger.error(`Cognito Service GET_USER_ATTRIBUTE_VERIFICATION_CODE Error: \n
      ${JSON.stringify(error, null, 2)} \n`);

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'LimitExceededException':
          throw new LayerError.ATTEMPT_LIMIT(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
    Cognito Service GET_USER_ATTRIBUTE_VERIFICATION_CODE Response: \n
    ${JSON.stringify(response, null, 2)} \n`);

    return response;
  }

  async verifyUserAttributeCode(
    accessToken: string,
    attributeName: string,
    code: string
  ): Promise<CognitoIdentityServiceProvider.Types.VerifyUserAttributeResponse> {
    logger.info(
      `Cognito Service VERIFY_USER_ATTRIBUTE_CODE Request: \n Attribute: ${attributeName} \n`
    );

    const params: CognitoIdentityServiceProvider.Types.VerifyUserAttributeRequest = {
      AccessToken: accessToken,
      AttributeName: attributeName,
      Code: code,
    };

    let response: CognitoIdentityServiceProvider.Types.VerifyUserAttributeResponse;

    try {
      response = await this.cognito.verifyUserAttribute(params).promise();
    } catch (error: any) {
      logger.error(`Cognito Service VERIFY_USER_ATTRIBUTE_CODE Error: \n
      ${JSON.stringify(error, null, 2)} \n`);

      switch (error.code) {
        case 'CodeMismatchException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'ExpiredCodeException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'LimitExceededException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'UserNotFoundException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(`
    Cognito Service VERIFY_USER_ATTRIBUTE_CODE Response: \n
    ${JSON.stringify(response, null, 2)} \n`);

    return response;
  }

  /**
   * @description Confirms the user  in the Cognito service by confirming the confirmation code that was sent either to the user email or phone number. Even if the code is sent to the user's phone number this function always takes the email as a parameter and the code to verify the user because the username in the Cognito is the email.
   * @param {String} email - User email.
   * @param {String} code - Confirmation code.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async confirmUser(
    email: string,
    code: string
  ): Promise<CognitoIdentityServiceProvider.ConfirmSignUpResponse> {
    logger.info(`Cogito Service CONFIRM_USER Request: \n email: ${email} \n code: ${code} \n`);

    const params: CognitoIdentityServiceProvider.Types.ConfirmSignUpRequest = {
      ClientId: this.clientId,
      SecretHash: this.calculateSecretHash(email),

      ConfirmationCode: code,
      Username: email,
    };

    let response: CognitoIdentityServiceProvider.ConfirmSignUpResponse;

    try {
      response = await this.cognito.confirmSignUp(params).promise();
    } catch (error: any) {
      logger.error(`Cogito Service CONFIRM_USER Error: \n ${JSON.stringify(error, null, 2)} \n`);
      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'CodeMismatchException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'ExpiredCodeException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        case 'NotAuthorizedException':
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
  async verifyUserPhoneNumber(
    accessToken: string,
    code: string
  ): Promise<CognitoIdentityServiceProvider.VerifyUserAttributeResponse> {
    logger.info(
      'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER Request: ' +
        JSON.stringify({ accessToken, code }, null, 2) +
        '\n'
    );

    const params: CognitoIdentityServiceProvider.Types.VerifyUserAttributeRequest = {
      AccessToken: accessToken,

      AttributeName: 'phone_number',
      Code: code,
    };

    let response: CognitoIdentityServiceProvider.VerifyUserAttributeResponse;

    try {
      response = await this.cognito.verifyUserAttribute(params).promise();
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

    logger.info(
      'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
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
  ): Promise<CognitoIdentityServiceProvider.VerifyUserAttributeResponse> {
    logger.info(
      'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER Request: ' +
        JSON.stringify({ accessToken, code }, null, 2) +
        '\n'
    );

    const params: CognitoIdentityServiceProvider.Types.VerifyUserAttributeRequest = {
      AccessToken: accessToken,

      AttributeName: 'email',
      Code: code,
    };

    let response: CognitoIdentityServiceProvider.VerifyUserAttributeResponse;

    try {
      response = await this.cognito.verifyUserAttribute(params).promise();
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

    logger.info(
      'COGNITO SERVICE VERIFY_USER_PHONE_NUMBER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
  }

  /**
   * @description Confirms the user account in the Cognito service as an admin.
   * @param {String} email - User email.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async adminConfirmUser(
    email: string
  ): Promise<CognitoIdentityServiceProvider.AdminConfirmSignUpResponse> {
    logger.info(
      'COGNITO SERVICE ADMIN_CONFIRM_USER Request: ' + JSON.stringify({ email }, null, 2)
    );

    const params: CognitoIdentityServiceProvider.Types.AdminConfirmSignUpRequest = {
      UserPoolId: this.userPoolId,

      Username: email,
    };

    let cognitoResponse: CognitoIdentityServiceProvider.AdminConfirmSignUpResponse;

    try {
      cognitoResponse = await this.cognito.adminConfirmSignUp(params).promise();
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

    logger.info(
      'COGNITO SERVICE ADMIN_CONFIRM_USER RESULT: ' +
        JSON.stringify(cognitoResponse, null, 2) +
        '\n'
    );

    return cognitoResponse;
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
  async sendForgotPasswordCode(
    email: string
  ): Promise<CognitoIdentityServiceProvider.ForgotPasswordResponse> {
    logger.info(`Cognito Service SEND_FORGOT_PASSWORD_CODE Request: ${email}`);

    const params: CognitoIdentityServiceProvider.Types.ForgotPasswordRequest = {
      ClientId: this.clientId,
      SecretHash: this.calculateSecretHash(email),

      Username: email,
    };

    let cognitoResponse: CognitoIdentityServiceProvider.ForgotPasswordResponse;

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
  async changeUserPasswordWithCode(
    email: string,
    code: string,
    password: string
  ): Promise<CognitoIdentityServiceProvider.ConfirmForgotPasswordResponse> {
    logger.info(
      `Cognito Service CHANGE_USER_PASSWORD_WITH_CODE Request: ${JSON.stringify(
        { email, code, password },
        null,
        2
      )}`
    );

    const params: CognitoIdentityServiceProvider.Types.ConfirmForgotPasswordRequest = {
      ClientId: this.clientId,
      ConfirmationCode: code,
      SecretHash: this.calculateSecretHash(email),

      Password: password,
      Username: email,
    };

    let response: CognitoIdentityServiceProvider.ConfirmForgotPasswordResponse;

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
  async authenticateUser(
    authflow: CognitoIdentityServiceProvider.AuthFlowType,
    payload: {
      username: string;
      password: string;
      refreshToken?: string;
    }
  ): Promise<CognitoIdentityServiceProvider.InitiateAuthResponse> {
    logger.info(
      'Cognito Service AUTHENTICATE_USER Request: ' + JSON.stringify(payload, null, 2) + '\n'
    );

    const secretHash = this.calculateSecretHash(payload.username);

    const params: CognitoIdentityServiceProvider.InitiateAuthRequest = {
      AuthFlow: authflow != null ? authflow : 'USER_PASSWORD_AUTH',

      AuthParameters: {
        SECRET_HASH: secretHash,

        USERNAME: payload.username,
        PASSWORD: payload.password,
        ...(payload.refreshToken && { REFRESH_TOKEN: payload.refreshToken }),
      },

      ClientId: this.clientId,
    };

    let response: CognitoIdentityServiceProvider.InitiateAuthResponse;

    try {
      response = await this.cognito.initiateAuth(params).promise();
    } catch (error: any) {
      console.log(error);
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

  async adminAuthenticateUser(
    authflow: CognitoIdentityServiceProvider.AuthFlowType,
    payload: {
      username: string;
      password: string;
      refreshToken?: string;
    }
  ): Promise<CognitoIdentityServiceProvider.AdminInitiateAuthResponse> {
    logger.info(
      'Cognito Service AUTHENTICATE_USER Request: ' + JSON.stringify(payload, null, 2) + '\n'
    );

    const secretHash = this.calculateSecretHash(payload.username);

    const params: CognitoIdentityServiceProvider.AdminInitiateAuthRequest = {
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      UserPoolId: this.userPoolId,

      AuthParameters: {
        SECRET_HASH: secretHash,

        USERNAME: payload.username,
        PASSWORD: payload.password,
        ...(payload.refreshToken && { REFRESH_TOKEN: payload.refreshToken }),
      },

      ClientId: this.clientId,
    };

    let response: CognitoIdentityServiceProvider.AdminInitiateAuthResponse;

    try {
      response = await this.cognito.adminInitiateAuth(params).promise();
    } catch (error: any) {
      console.log(error);
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
  async changeUserPassword(
    accessToken: string,
    oldPassword: string,
    newPassword: string
  ): Promise<CognitoIdentityServiceProvider.ChangePasswordResponse> {
    logger.info(`
      Cognito Service CHANGE_USER_PASSWORD Request: ${JSON.stringify(
        { accessToken, oldPassword, newPassword },
        null,
        2
      )}
    `);

    let response: CognitoIdentityServiceProvider.ChangePasswordResponse;

    const params: CognitoIdentityServiceProvider.ChangePasswordRequest = {
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
    };

    try {
      response = await this.cognito.changePassword(params).promise();
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
      Cognito Service CHANGE_USER_PASSWORD Response: ${JSON.stringify(response, null, 2)}
    `);

    return response;
  }

  /**
   * @description Refreshes the user access token.
   * @param {String} refreshToken - User refresh token.
   * @returns {Promise<JSON>} - JWT token.
   */
  async refreshUserToken(
    refreshToken: string
  ): Promise<CognitoIdentityServiceProvider.InitiateAuthResponse> {
    logger.info(
      'Cognito Service REFRESH_USER_TOKEN Request: ' + JSON.stringify(refreshToken, null, 2) + '\n'
    );

    const params: CognitoIdentityServiceProvider.InitiateAuthRequest = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',

      ClientId: this.clientId,

      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    let response: CognitoIdentityServiceProvider.InitiateAuthResponse;

    try {
      response = await this.cognito.initiateAuth(params).promise();
    } catch (error: any) {
      logger.error(
        'Cognito Service REFRESH_USER_TOKEN Error: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE REFRESH_USER_TOKEN SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
  }

  /**
   * @description Logs out the user in the Cognito service.
   * @param {String} accessToken - User access token.
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async logoutUser(
    accessToken: string
  ): Promise<CognitoIdentityServiceProvider.GlobalSignOutResponse> {
    logger.info(`
        Cognito Service LOGOUT_USER Request: \n ${JSON.stringify(accessToken, null, 2)}`);

    const params: CognitoIdentityServiceProvider.GlobalSignOutRequest = {
      AccessToken: accessToken,
    };

    let response: CognitoIdentityServiceProvider.GlobalSignOutResponse;

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
  async adminGetUser(
    username: string
  ): Promise<CognitoIdentityServiceProvider.AdminGetUserResponse> {
    logger.info(`Cognito Service ADMIN_GET_USER Request: \n ${JSON.stringify(username, null, 2)}`);

    const params: CognitoIdentityServiceProvider.AdminGetUserRequest = {
      UserPoolId: this.userPoolId,

      Username: username,
    };

    let response: CognitoIdentityServiceProvider.AdminGetUserResponse;
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
   * @description Deletes the user in the Cognito service.
   * @param
   * @returns {Promise<JSON>} - AWS Cognito response.
   */
  async adminDeleteUser(username: string): Promise<{ $response: AWS.Response<{}, AWS.AWSError> }> {
    logger.info(
      'Cognito Service ADMIN_DELETE_USER Request: ' + JSON.stringify(username, null, 2) + '\n'
    );

    const params: CognitoIdentityServiceProvider.AdminDeleteUserRequest = {
      UserPoolId: this.userPoolId,
      Username: username,
    };

    let response: { $response: AWS.Response<{}, AWS.AWSError> };

    try {
      response = await this.cognito.adminDeleteUser(params).promise();
    } catch (error: any) {
      logger.error(
        'Cognito Service ADMIN_DELETE_USER Error: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE ADMIN_DELETE_USER SUCESS: ' + JSON.stringify(response, null, 2) + '\n'
    );

    return response;
  }

  async respondToAuthChallenge(
    challengeName: CognitoIdentityServiceProvider.ChallengeNameType,
    session: CognitoIdentityServiceProvider.SessionType,
    challengePayload: CognitoIdentityServiceProvider.ChallengeResponsesType
  ): Promise<CognitoIdentityServiceProvider.RespondToAuthChallengeResponse> {
    logger.info(
      'Cognito Service RESPOND_TO_AUTH_CHALLENGE Request: ' +
        JSON.stringify(
          {
            challengeName,
            session,
            challengePayload,
          },
          null,
          2
        ) +
        '\n'
    );

    const params: CognitoIdentityServiceProvider.RespondToAuthChallengeRequest = {
      ClientId: this.clientId,
      ChallengeName: challengeName,
      Session: session,
      ChallengeResponses: {
        SECRET_HASH: this.calculateSecretHash(challengePayload.USERNAME),
        ...challengePayload,
      },
    };

    logger.info('CHALLENGE PAYLOAD: ' + JSON.stringify(params.ChallengeResponses, null, 2) + '\n');

    let response: CognitoIdentityServiceProvider.RespondToAuthChallengeResponse;

    try {
      response = await this.cognito.respondToAuthChallenge(params).promise();
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE RESPOND_TO_AUTH_CHALLENGE RESULT: ' +
        JSON.stringify(response, null, 2) +
        '\n'
    );

    return response;
  }

  async getSession(accessToken: string): Promise<CognitoIdentityServiceProvider.GetUserResponse> {
    logger.info(
      'Cognito Service GET_SESSION Request: ' + JSON.stringify(accessToken, null, 2) + '\n'
    );

    const params: CognitoIdentityServiceProvider.GetUserRequest = {
      AccessToken: accessToken,
    };

    let cognitoResponse: CognitoIdentityServiceProvider.GetUserResponse;

    try {
      cognitoResponse = await this.cognito.getUser(params).promise();
    } catch (error: any) {
      logger.error('COGNITO SERVICE GET_SESSION ERROR: ' + JSON.stringify(error, null, 2) + '\n');

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE GET_SESSION SUCESS: ' + JSON.stringify(cognitoResponse, null, 2) + '\n'
    );

    return cognitoResponse;
  }

  // -------------------------------------------------------------------------------------------- //
  //                                                                                              //
  //                                           DEPRECATED                                         //
  //                                                                                              //
  // -------------------------------------------------------------------------------------------- //

  /**
   * @deprecated
   *
   * @example
   *
   * const Cognito = new CognitoService();
   * const verifyEmail = await cognitoService.adminUpdateUserAttribute("username", "email_verified", "true");
   * const verifyPhone = await cognitoService.adminUpdateUserAttribute("username", "phone_number_verified", "true");
   */
  async adminUpdateUserAttribute(
    username: string,
    attributeName: 'email_verified' | 'phone_number_verified',
    attributeValue: string
  ): Promise<CognitoIdentityServiceProvider.AdminUpdateUserAttributesResponse> {
    const params: CognitoIdentityServiceProvider.AdminUpdateUserAttributesRequest = {
      UserAttributes: [
        {
          Name: attributeName,
          Value: attributeValue,
        },
      ],
      UserPoolId: this.userPoolId,
      Username: username,
    };

    let response: CognitoIdentityServiceProvider.AdminUpdateUserAttributesResponse;

    try {
      response = await this.cognito.adminUpdateUserAttributes(params).promise();
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE ERROR: ' +
          JSON.stringify(error, null, 2) +
          '\n'
      );

      switch (error.code) {
        case 'UserNotFoundException':
          throw new LayerError.NOT_FOUND(error.message);

        case 'InvalidParameterException':
          throw new LayerError.INVALID_PARAMETER(error.message);

        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE ADMIN_UPDATE_USER_ATTRIBUTE SUCESS: ' +
        JSON.stringify(response, null, 2) +
        '\n'
    );

    return response;
  }

  /**
   * @deprecated
   */
  async updateUser(
    accessToken: string,
    attributes: CognitoIdentityServiceProvider.AttributeType[]
  ): Promise<CognitoIdentityServiceProvider.UpdateUserAttributesResponse> {
    const params: CognitoIdentityServiceProvider.UpdateUserAttributesRequest = {
      AccessToken: accessToken,
      UserAttributes: attributes,
    };

    let response: CognitoIdentityServiceProvider.UpdateUserAttributesResponse;

    try {
      response = await this.cognito.updateUserAttributes(params).promise();
    } catch (error: any) {
      logger.error('Cognito Service UPDATE_USER Error: ' + JSON.stringify(error, null, 2) + '\n');

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info('COGNITO SERVICE UPDATE_USER SUCESS: ' + JSON.stringify(response, null, 2) + '\n');

    return response;
  }

  /**
   * @deprecated
   */
  async getUserRoles(
    username: string
  ): Promise<CognitoIdentityServiceProvider.AdminListGroupsForUserResponse> {
    const params: CognitoIdentityServiceProvider.AdminListGroupsForUserRequest = {
      UserPoolId: this.userPoolId,
      Username: username,
    };

    let cognitoResponse: CognitoIdentityServiceProvider.AdminListGroupsForUserResponse;

    try {
      cognitoResponse = await this.cognito.adminListGroupsForUser(params).promise();
    } catch (error: any) {
      logger.error(
        'COGNITO SERVICE GET_USER_ROLES ERROR: ' + JSON.stringify(error, null, 2) + '\n'
      );

      switch (error.code) {
        default:
          throw new LayerError.INTERNAL_ERROR(error.message);
      }
    }

    logger.info(
      'COGNITO SERVICE GET_USER_ROLES SUCESS: ' + JSON.stringify(cognitoResponse, null, 2) + '\n'
    );

    return cognitoResponse;
  }

  /**
   * @deprecated
   */
  async addUserToGroup(username: string, groupName: string) {
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
      SecretHash: this.calculateSecretHash(username),
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

  /**
   * @deprecated
   */
  async addUserCustomAttribute(username, attributeName, attributeValue) {
    try {
      const params = {
        UserAttributes: [
          {
            Name: attributeName,
            Value: attributeValue,
          },
        ],
        SecretHash: this.calculateSecretHash(username),

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

  /**
   * @deprecated
   */
  async getUserCustomAttribute(username, attributeName) {
    const params = {
      UserPoolId: AWS_COGNITO_BUSINESS_USER_POOL_ID,
      Username: username,
      SecretHash: this.calculateSecretHash(username),
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
}
