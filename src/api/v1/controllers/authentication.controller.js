// Import Cognito Service
import cognito from '../services/cognito.service';

// Import database access objects
import crmUsersDAO from '../db/crmUsers.dao';
import marketplaceUsersDAO from '../db/marketplaceUsers.dao';

import logger from '../../../logs/logger';
import { HTTPError } from '@api/v1/utils/errors/http';
import authHelper from '../helpers/auth/auth.helper';
import CRUD from './crud.controller';
import authUtils from '../utils/auth/auth.utils';
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../config/constants/index';
import { countries } from '../../../assets/data/countries';
import stripe from '../services/stripe.service';

export default class AuthenticationController {
  /**
   * @todo Debuging
   */
  static async signup(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let app;

      if (req.url === `/auth/marketplace/signup`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        throw new HTTPError._400('Invalid login request.');
      }

      Cognito = new cognito(clientId);

      let newUser = req.body.user;
      let cognitoResponse;
      let MarketplaceUsersDAO;
      let refreshToken;

      let mongodbResponse;

      if (app === 'marketplace') {
        MarketplaceUsersDAO = new marketplaceUsersDAO();
      }

      try {
        cognitoResponse = await Cognito.addUser(newUser.email, newUser.password, newUser.phone);
      } catch (err) {
        switch (err.type) {
          case 'INVALID_PARAMETER':
            throw new HTTPError._400(err.message);

          default:
            throw new HTTPError._500(err.message);
        }
      }

      newUser.cognito_id = cognitoResponse.UserSub;

      try {
        // Attempting to add a new user to the database
        mongodbResponse = await MarketplaceUsersDAO.create(newUser);
        delete mongodbResponse._id;
        delete mongodbResponse.cognito_id;
      } catch (err) {
        switch (err.type) {
          case 'INVALID_PARAMETER':
            throw new HTTPError._400(err.message);

          default:
            throw new HTTPError._500(err.message);
        }
      }

      delete newUser.password;
      delete newUser.confirmPassword;

      response.statusCode = 200;
      response.data = mongodbResponse;

      next(response);
    } catch (err) {
      switch (err.type) {
        case 'INVALID_PARAMETER':
          throw new HTTPError._400(err.message);

        default:
          throw new HTTPError._500(err.message);
      }
    }
  }
  catch(error) {
    next(error);
  }

  /**
   *  @todo Debuging
   */
  static async sendConfirmationCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let app;

      if (req.url === `/auth/marketplace/send/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        throw new HTTPError._400('Invalid request.');
      }

      Cognito = new cognito(clientId);

      let cognitoResponse;

      try {
        cognitoResponse = await Cognito.sendConfirmationCode(req.body.email);
      } catch (error) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            throw new HTTPError._400(error.message);

          case 'NOT_FOUND':
            throw new HTTPError._404(error.message);

          default:
            throw new HTTPError._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Confirmation code sent successfully.',
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   *  @todo Debuging
   */
  static async verifyConfirmationCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let StripeService = new stripe();
      let app;
      let user;

      if (req.url === `/auth/marketplace/verify/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        throw new HTTPError._400('Invalid request.');
      }

      Cognito = new cognito(clientId);

      let cognitoResponse;

      try {
        cognitoResponse = await Cognito.confirmUser(req.body.email, req.body.code);
      } catch (error) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            throw new HTTPError._400(error.message);

          case 'NOT_FOUND':
            throw new HTTPError._404(error.message);

          default:
            throw new HTTPError._500(error.message);
        }
      }

      /**
       * Get the user from the database
       */
      let MarketplaceUsersDAO = new marketplaceUsersDAO();

      try {
        user = await MarketplaceUsersDAO.queryOne({
          email: req.body.email,
        });
      } catch (error) {
        throw new HTTPError._500(error.message);
      }

      /**
       * After the user is successfully confirmed we need to create a customer_id in Stripe
       */
      const customer_id = (
        await StripeService.createCustomer({
          email: user.email,
          name: user.name,
          phone: user.phone,
        })
      ).id;

      console.log('STRIPE: ' + JSON.stringify(customer_id, null, 2));

      /**
       * Update the user in the database with the customer_id
       */
      try {
        user.stripe_information = {
          customer_id: customer_id,
        };

        await MarketplaceUsersDAO.update(user);
      } catch (error) {
        throw new HTTPError._500(error.message);
      }

      response.statusCode = 200;
      response.data = {
        message: 'Confirmation code verified successfully. User is now active and able to login.',
      };

      next(response);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  /**
   * Login a user
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async login(req, res, next) {
    try {
      logger.info(
        `Authentication Controller LOGIN Request: \n ${JSON.stringify(req.body, null, 2)}`
      );

      let response = {};
      let responseAux = {};
      let clientId;
      let app;
      let cognitoResponse = {};

      /**
       * Check if the login request if for the CRM or the Marketplace by checking the url
       */

      if (req.url === `/auth/crm/login`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
        app = 'crm';
      } else if (req.url === `/auth/marketplace/login`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        throw new HTTPError._400('Invalid login request.');
      }

      let Cognito = new cognito(clientId);

      var payload = { email: req.body.email, password: req.body.password };

      try {
        cognitoResponse = await Cognito.authenticateUser('USER_PASSWORD_AUTH', payload);
      } catch (error) {
        logger.error(`Authentication Controller LOGIN Error: \n ${JSON.stringify(error, null, 2)}`);
        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User does not exist.');

          case 'UNAUTHORIZED':
            throw new HTTPError._401(error.message);

          default:
            throw new HTTPError._500(error.message);
        }
      }

      // User authenticated successfully

      // Check for challenges
      if (cognitoResponse.ChallengeName != null) {
        switch (cognitoResponse.ChallengeName) {
          case 'NEW_PASSWORD_REQUIRED':
            /**
             * @todo
             */
            break;
        }
      }

      // No challenges
      else {
        responseAux.accessToken = cognitoResponse.AuthenticationResult.AccessToken;
        responseAux.accessTokenExpiration = cognitoResponse.AuthenticationResult.ExpiresIn;
        responseAux.accessTokenType = cognitoResponse.AuthenticationResult.TokenType;
        responseAux.refreshToken = cognitoResponse.AuthenticationResult.RefreshToken;
        responseAux.expiresIn = cognitoResponse.AuthenticationResult.ExpiresIn;
      }

      response.statusCode = 200;
      response.data = responseAux;
      response.accessToken = responseAux.accessToken;
      response.refreshToken = responseAux.refreshToken;
      response.expiresIn = responseAux.expiresIn;

      next(response);
    } catch (error) {
      logger.error(`Authentication Controller LOGIN Error: \n ${error.stack}`);
      next(error);
    }
  }

  /**
   * Changes a user password.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   * @throws {Error._401} - Token has expired.
   * @throws {Error._400} - Attempt limit exceeded.
   */
  static async changePassword(req, res, next) {
    try {
      let response = {};
      let accessToken;

      let cognitoResponse;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('Missing required authorization token.');
      }

      let Cognito = new cognito(accessToken);

      try {
        cognitoResponse = await Cognito.changeUserPassword(
          accessToken,
          req.body.oldPassword,
          req.body.newPassword
        );
      } catch (error) {
        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User does not exist.');

          case 'UNAUTHORIZED':
            throw new HTTPError._401(error.message);

          case 'ATTEMPT_LIMIT':
            throw new HTTPError._400(error.message);

          default:
            throw new HTTPError._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Password changed successfully',
      };

      next(response);
    } catch (error) {
      logger.error(`Authentication Controller CHANGE_PASSWORD Internal Error: \n ${error.stack}`);
      next(error);
    }
  }

  /**
   * Logout a user.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   * @throws {Error._401} - Token has expired.
   */
  static async logout(req, res, next) {
    try {
      let token;
      let response = {};

      let Cognito = new cognito();

      if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      try {
        const cognitoResponse = await Cognito.logoutUser(token);
      } catch (error) {
        logger.error(
          `Authentication Controller LOGOUT Error: \n ${JSON.stringify(error, null, 2)}`
        );

        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User does not exist.');

          case 'UNAUTHORIZED':
            throw new HTTPError._401('Token has expired.');

          case 'INVALID_PARAMETER':
            throw new HTTPError._400('Invalid access token.');

          default:
            throw new HTTPError._500('Internal server error.');
        }
      }

      response.statusCode = 200;
      response.data = { message: 'User logged out successfully' };

      next(response);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  /**
   * Sends a code to the user to reset their password.
   * For the Marketplace users the code is sent to the user's phone.
   * For the CRM users the code is sent to the user's email.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   */
  static async sendForgotPasswordCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;

      if (req.url === `/auth/crm/send/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/send/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        throw new HTTPError._400('Invalid login request.');
      }

      Cognito = new cognito(clientId);

      try {
        const cognitoResponse = await Cognito.sendForgotPasswordCode(req.body.email);
      } catch (error) {
        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User not found');

          default:
            throw new HTTPError._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Password reset code sent successfully',
      };

      next(response);
    } catch (error) {
      logger.error(`Authentication Controller SEND_FORGOT_PASSWORD_CODE Error: \n ${error.stack}`);
      next(error);
    }
  }

  /**
   * Verifies the code sent to the user to reset their password.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   */
  static async verifyForgotPasswordCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;

      if (req.url === `/auth/crm/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        throw new HTTPError._400('Invalid login request.');
      }

      Cognito = new cognito(clientId);

      try {
        const cognitoResponse = await Cognito.changeUserPasswordWithCode(
          req.body.email,
          req.body.code,
          req.body.newPassword
        );
      } catch (error) {
        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User not found');

          case 'INVALID_CODE':
            throw new HTTPError._400('Invalid code. Please request a new code.');

          default:
            throw new HTTPError._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Password reseted successfully.' };

      next(response);
    } catch (error) {
      logger.error(`Authentication Controller SEND_FORGOT_PASSWORD_CODE Error: \n ${error.stack}`);
      next(error);
    }
  }

  static async adminLogin(req, res, next) {}
}
