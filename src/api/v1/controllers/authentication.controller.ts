// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';

// @api
import {
  CompaniesDAO,
  HomeCareOrdersDAO,
  CompanyReviewsDAO,
  CollaboratorsDAO,
  CustomersDAO,
} from '@api/v1/db';
import { AuthHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICustomer,
  ICompanyReview,
  IHomeCareOrder,
  ICompany,
  IQueryListResponse,
  ICustomerModel,
  ICollaboratorModel,
} from '@api/v1/interfaces';
import { CustomerModel } from '@api/v1/models';
import { CognitoService, StripeService } from '@api/v1/services';
import { HTTPError } from '@api/v1/utils';
// @logger
import logger from '@logger';
// @constants
import { AWS_COGNITO_MARKETPLACE_CLIENT_ID, AWS_COGNITO_CRM_CLIENT_ID } from '@constants';
import Stripe from 'stripe';

export default class AuthenticationController {
  // db
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CustomersDAO = new CustomersDAO();
  static CompaniesDAO = new CompaniesDAO();
  // services
  static StripeService = StripeService;
  // helpers
  static AuthHelper = AuthHelper;

  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: any = {};

      let clientId: string;
      let Cognito: CognitoService;
      let app: string;

      if (req.url === `/auth/marketplace/signup`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        next(new HTTPError._400('Invalid login request.'));
        return;
      }

      Cognito = new CognitoService(clientId);

      const { password, customer: reqCustomer } = req.body as {
        password: string;
        customer: ICustomer;
      };

      // create a new customer model
      let newCustomer = new CustomerModel(reqCustomer);
      // get the password and confirm password from the request body
      let cognitoResponse: any;

      let mongodbResponse: any;

      try {
        cognitoResponse = await Cognito.addUser(newCustomer.email, password, newCustomer.phone);
      } catch (err: any) {
        switch (err.type) {
          case 'INVALID_PARAMETER':
            next(new HTTPError._400(err.message));
            return;

          default:
            next(new HTTPError._500(err.message));
            return;
        }
      }

      newCustomer.cognito_id = cognitoResponse.UserSub;

      try {
        mongodbResponse = await this.CustomersDAO.create(newCustomer);
        delete mongodbResponse._id;
        delete mongodbResponse.cognito_id;
      } catch (err: any) {
        switch (err.type) {
          case 'INVALID_PARAMETER':
            next(new HTTPError._400(err.message));
            return;

          default:
            next(new HTTPError._500(err.message));
            return;
        }
      }

      response.statusCode = 200;
      response.data = mongodbResponse;

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async sendConfirmationCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let clientId: string;
      let Cognito: CognitoService;
      let app: string;

      const { email } = req.body as { email: string };

      if (req.url === `/auth/marketplace/send/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        next(new HTTPError._400('Invalid request.'));
        return;
      }

      Cognito = new CognitoService(clientId);

      let cognitoResponse: any;

      try {
        cognitoResponse = await Cognito.sendConfirmationCode(email);
      } catch (error: any) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            next(new HTTPError._400(error.message));
            return;

          case 'NOT_FOUND':
            next(new HTTPError._404(error.message));
            return;

          default:
            next(new HTTPError._500(error.message));
            return;
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Confirmation code sent successfully.',
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
  static async verifyConfirmationCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let clientId: string;
      let Cognito: any;
      let app: string;
      let user: any;

      const { email, code } = req.body as { email: string; code: string };

      if (req.url === `/auth/marketplace/verify/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        response.statusCode = 400;
        response.data = { message: 'Invalid request.' };
        return next(response);
      }

      Cognito = new CognitoService(clientId);

      let cognitoResponse: any;

      try {
        cognitoResponse = await Cognito.confirmUser(email, code);
      } catch (error: any) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            return next(new HTTPError._400(error.message));

          case 'NOT_FOUND':
            return next(new HTTPError._404(error.message));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      try {
        user = await this.CustomersDAO.queryOne({
          email: email,
        });
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      const customer_id = (
        await this.StripeService.createCustomer({
          email: user.email,
          name: user.name,
          phone: user.phone,
        })
      ).id;

      console.log('STRIPE: ' + JSON.stringify(customer_id, null, 2));

      try {
        user.stripe_information = {
          customer_id: customer_id,
        };

        await this.CustomersDAO.update(user);
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      response.statusCode = 200;
      response.data = {
        message: 'Confirmation code verified successfully. User is now active and able to login.',
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(
        `Authentication Controller LOGIN Request: \n ${JSON.stringify(req.body, null, 2)}`
      );

      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let clientId: string;
      let app: string;
      let cognitoResponse: any = {};

      const { email, password } = req.body as { email: string; password: string };

      if (req.url === `/auth/crm/login`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
        app = 'crm';
      } else if (req.url === `/auth/marketplace/login`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        response.statusCode = 400;
        response.data = { message: 'Invalid login request.' };
        return next(response);
      }

      const Cognito = new CognitoService(clientId);

      const payload = { email: email, password: password };

      try {
        cognitoResponse = await Cognito.authenticateUser('USER_PASSWORD_AUTH', payload);
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
            /**
             * @todo
             */
            break;
        }
      } else {
        const responseAux: any = {
          accessToken: cognitoResponse.AuthenticationResult.AccessToken,
          accessTokenExpiration: cognitoResponse.AuthenticationResult.ExpiresIn,
          accessTokenType: cognitoResponse.AuthenticationResult.TokenType,
          refreshToken: cognitoResponse.AuthenticationResult.RefreshToken,
        };

        response.statusCode = 200;
        response.data = responseAux;
      }

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

      let cognitoResponse: any;

      let accessToken: string;

      const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const Cognito = new CognitoService(accessToken);

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

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token: string;
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let clientId: string;
      let app: string;

      if (req.url === `/auth/crm/logout`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
        app = 'crm';
      } else if (req.url === `/auth/marketplace/logout`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = 'marketplace';
      } else {
        return next(new HTTPError._400('Invalid logout request.'));
      }

      const Cognito = new CognitoService(clientId);

      if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
      } else {
        return next(new HTTPError._400('No authorization token provided.'));
      }

      try {
        await Cognito.logoutUser(token);
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

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async sendForgotPasswordCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let clientId: string;
      let Cognito: CognitoService;

      const { email } = req.body as { email: string };

      if (req.url === `/auth/crm/send/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/send/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        return next(new HTTPError._400('Invalid login request.'));
      }

      Cognito = new CognitoService(clientId);

      try {
        await Cognito.sendForgotPasswordCode(email);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('User not found'));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Password reset code sent successfully',
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async verifyForgotPasswordCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { email, code, newPassword } = req.body as {
        email: string;
        code: string;
        newPassword: string;
      };

      let clientId: string;
      let Cognito: CognitoService;

      if (req.url === `/auth/crm/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        throw new HTTPError._400('Invalid login request.');
      }

      Cognito = new CognitoService(clientId);

      try {
        await Cognito.changeUserPasswordWithCode(email, code, newPassword);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('User not found'));

          case 'INVALID_CODE':
            return next(new HTTPError._400('Invalid code. Please request a new code.'));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Password reset successfully.' };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async account(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      let responseAux: any = {};

      let cognitoId: string;
      let app: string = '';

      let cognitoResponse: any = {};

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let clientId = await this.AuthHelper.getClientId(accessToken);

      let userAttributes: any;

      try {
        userAttributes = await this.AuthHelper.getUserAttributes(accessToken);
      } catch (error: any) {
        throw new HTTPError._500(error.message);
      }

      cognitoId = userAttributes.find((attribute) => attribute.Name === 'sub')?.Value;

      let phoneVerified = userAttributes.find(
        (attribute) => attribute.Name === 'phone_number_verified'
      )?.Value;

      let emailVerified = userAttributes.find(
        (attribute) => attribute.Name === 'email_verified'
      )?.Value;

      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        app = 'crm';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      let user: ICustomerModel | ICollaboratorModel | null = null;

      try {
        if (app === 'crm') {
          user = await this.CollaboratorsDAO.queryOne(
            {
              cognito_id: '39425f3b-a637-4e6a-9db4-97fd2132a416',
            },
            [
              {
                path: 'company',
                model: 'Company',
                populate: [
                  {
                    path: 'services',
                    model: 'Service',
                    select: '-__v -created_at -updated_at -translations',
                  },
                  {
                    path: 'team',
                    model: 'crm_user',
                    select: '-__v -createdAt -updatedAt -cognito_id -settings -company',
                  },
                ],
                select: '-__v -createdAt -updatedAt',
              },
            ]
          );
        } else if (app === 'marketplace') {
          user = await this.CustomersDAO.queryOne({
            cognito_id: { $eq: cognitoId },
          });
        }
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            throw new HTTPError._404('User not found.');
          default:
            throw new HTTPError._500(error.message);
        }
      }

      const userJSON = user ? user.toJSON() : {};

      /**
       * Get External Accounts from Stripe
       */
      let Stripe = new StripeService();
      let connectedAccountId: string;
      let externalAccounts: any;
      if (app === 'crm' && userJSON.company.stripe_information.account_id) {
        connectedAccountId = userJSON.company.stripe_information.account_id;

        externalAccounts = await this.StripeService.listExternalAccounts(connectedAccountId);
        userJSON.company.stripe_information.external_accounts = externalAccounts.data;
      }

      let customerId;
      let paymentMethods;

      /**
       * Get Payment Methods from Stripe
       */
      if (app === 'marketplace') {
        customerId = (user as ICustomer).stripe_information?.customer_id;

        const default_payment_method = (
          (await this.StripeService.getCustomer(customerId)) as Stripe.Customer
        ).default_source;

        userJSON.stripe_information.default_payment_method = default_payment_method;
      }

      // Convert user to JSON

      userJSON.phone_verified = phoneVerified;
      userJSON.email_verified = emailVerified;
      delete userJSON.createdAt;
      delete userJSON.updatedAt;
      delete userJSON.__v;
      delete userJSON.cognito_id;

      response.statusCode = 200;
      response.data = user;

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
