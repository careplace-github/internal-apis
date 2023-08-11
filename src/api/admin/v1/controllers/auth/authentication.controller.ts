// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  CustomersDAO,
  CaregiversDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICustomer,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  ICustomerDocument,
  ICollaboratorDocument,
  ICaregiverDocument,
} from 'src/packages/interfaces';
import { CaregiverModel, CollaboratorModel, CustomerModel } from 'src/packages/models';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
// @constants
import {
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_ADMIN_CLIENT_ID,
} from '@constants';
import Stripe from 'stripe';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';
import { PATHS } from '@packages/routes';

export default class AdminAuthenticationController {
  // helpers
  static AuthHelper = AuthHelper;

  static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(
        `Authentication Controller LOGIN Request: \n ${JSON.stringify(req.body, null, 2)}`
      );

      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let cognitoResponse: any = {};

      const { email, phone, password } = req.body as {
        email: string;
        phone: string;
        password: string;
      };

      if ((!email && !phone) || !password) {
        return next(new HTTPError._400('Missing required parameters.'));
      }

      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      logger.info('CLIENT ID: ' + clientId);
      logger.info('AWS_COGNITO_ADMIN_CLIENT_ID: ' + AWS_COGNITO_ADMIN_CLIENT_ID);

      if (clientId !== AWS_COGNITO_ADMIN_CLIENT_ID) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      const Cognito = new CognitoService(clientId);

      const username = email ? email : phone;

      logger.info('USERNAME: ' + username);

      const payload = { username: username, password: password };

      try {
        cognitoResponse = await Cognito.adminAuthenticateUser('USER_PASSWORD_AUTH', payload);
      } catch (error: any) {
        logger.error(`Authentication Controller LOGIN Error: \n ${JSON.stringify(error, null, 2)}`);
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('User does not exist.'));

          case 'UNAUTHORIZED':
            return next(new HTTPError._401(error.message));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (cognitoResponse.ChallengeName != null) {
        switch (cognitoResponse.ChallengeName) {
          case 'NEW_PASSWORD_REQUIRED':
            cognitoResponse = await Cognito.respondToAuthChallenge(
              'NEW_PASSWORD_REQUIRED',
              cognitoResponse.Session,
              {
                USERNAME: username,
                NEW_PASSWORD: password,
              }
            );
            break;
        }
      }
      const responseAux: any = {
        accessToken: cognitoResponse.AuthenticationResult.AccessToken,
        accessTokenExpiration: cognitoResponse.AuthenticationResult.ExpiresIn,
        accessTokenType: cognitoResponse.AuthenticationResult.TokenType,
        refreshToken: cognitoResponse.AuthenticationResult.RefreshToken,
      };

      response.statusCode = 200;
      response.data = responseAux;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
      let cognitoResponse: any;

      const clientId = await AdminAuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        cognitoResponse = await Cognito.changeUserPassword(accessToken, oldPassword, newPassword);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('User does not exist.'));

          case 'UNAUTHORIZED':
            return next(new HTTPError._401(error.message));

          case 'ATTEMPT_LIMIT':
            return next(new HTTPError._400(error.message));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Password changed successfully',
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async signout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const clientId = await AdminAuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.logoutUser(accessToken);
      } catch (error: any) {
        logger.error(
          `Authentication Controller LOGOUT Error: \n ${JSON.stringify(error, null, 2)}`
        );

        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('User does not exist.'));

          case 'UNAUTHORIZED':
            return next(new HTTPError._401('Token has expired.'));

          case 'INVALID_PARAMETER':
            return next(new HTTPError._400('Invalid access token.'));

          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'User logged out successfully' };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
