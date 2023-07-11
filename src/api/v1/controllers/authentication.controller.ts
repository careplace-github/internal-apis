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
} from '@api/v1/db';
import { AuthHelper } from '@api/v1/helpers';
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
} from 'src/api/v1/interfaces';
import { CustomerModel } from '@api/v1/models';
import { CognitoService, StripeService } from '@api/v1/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
// @constants
import { AWS_COGNITO_MARKETPLACE_CLIENT_ID, AWS_COGNITO_BUSINESS_CLIENT_ID } from '@constants';
import Stripe from 'stripe';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

export default class AuthenticationController {
  // db
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CaregiversDAO = new CaregiversDAO();
  static CustomersDAO = new CustomersDAO();
  static HealthUnitsDAO = new HealthUnitsDAO();
  // services
  static StripeService = StripeService;
  // helpers
  static AuthHelper = AuthHelper;

  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: any = {};

      const clientId = req.headers['x-client-id'];
      let Cognito: CognitoService;

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      logger.info("Client ID: " + clientId);

      Cognito = new CognitoService(clientId);

      const { password, customer: reqCustomer } = req.body as {
        password: string;
        customer: ICustomer;
      };

      // create a new customer model
      let newCustomer = new CustomerModel(reqCustomer);

      // validate the new customer model
      const validationError = newCustomer.validateSync({ pathsToSkip: ['cognito_id'] });

      if (validationError) {
        next(new HTTPError._400(validationError.message));
        return;
      }

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
        mongodbResponse = await AuthenticationController.CustomersDAO.create(newCustomer);
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

      // pass the response to the next middleware
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

      const clientId = req.headers['x-client-id'];
      let Cognito: CognitoService;

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
      ) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      Cognito = new CognitoService(clientId);
      const { email } = req.body as { email: string };

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

      // Pass to the next middleware to handle the response
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

      let Cognito: CognitoService;
      let user: ICustomerDocument;

      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      Cognito = new CognitoService(clientId);

      let cognitoResponse: CognitoIdentityServiceProvider.ConfirmSignUpResponse;

      const { email, code } = req.body as { email: string; code: string };

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
        user = await AuthenticationController.CustomersDAO.queryOne({
          email: email,
        });
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      const customer_id = (
        await AuthenticationController.StripeService.createCustomer({
          email: user.email,
          name: user.name,
          phone: user.phone,
        })
      ).id;

      try {
        user.stripe_information = {
          customer_id: customer_id,
        };

        await AuthenticationController.CustomersDAO.update(user);
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      response.statusCode = 200;
      response.data = {
        message: 'Confirmation code verified successfully. User is now active and able to login.',
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

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

      const { email, password } = req.body as { email: string; password: string };

      if (!email || !password) {
        return next(new HTTPError._400('Missing required parameters.'));
      }

      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
      ) {
        return next(new HTTPError._400('Invalid client id.'));
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
            // FIXME handle cognito response challenges
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

      const clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
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

      const clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
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

      let Cognito: CognitoService;

      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
      ) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      const { email } = req.body as { email: string };

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

      // Pass to the next middleware to handle the response
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

      if (!email || !code || !newPassword) {
        return next(
          new HTTPError._400(
            'Missing required parameters. Required parameters: email, code, newPassword.'
          )
        );
      }

      let Cognito: CognitoService;

      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return next(new HTTPError._400('Missing required header: x-client-id'));
      }

      if (
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
      ) {
        return next(new HTTPError._400('Invalid client id.'));
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

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let app: string = '';

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const [clientId, cognitoId] = await Promise.all([
        AuthenticationController.AuthHelper.getClientIdFromAccessToken(accessToken),
        AuthenticationController.AuthHelper.getAuthId(accessToken),
      ]);

      logger.info("CLIENT ID: " + clientId)

      let userAttributes: CognitoIdentityServiceProvider.AttributeListType | undefined;

      try {
        userAttributes = await AuthenticationController.AuthHelper.getUserAttributes(accessToken);
      } catch (error: any) {
        throw new HTTPError._500(error.message);
      }

      let phoneVerified = false;
      let emailVerified = false;

      if (userAttributes) {
        phoneVerified =
          userAttributes.find((attribute) => attribute.Name === 'phone_number_verified')?.Value ===
          'true';

        emailVerified =
          userAttributes.find((attribute) => attribute.Name === 'email_verified')?.Value === 'true';
      }



      if (clientId === AWS_COGNITO_BUSINESS_CLIENT_ID) {
        app = 'business';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      logger.debug("APP: " + app)
      logger.info("APP: "+ app)


      let user: ICustomerDocument | ICollaboratorDocument | null = null;

      try {
        if (app === 'business') {
          user = await AuthenticationController.CollaboratorsDAO.queryOne(
            {
              cognito_id: '39425f3b-a637-4e6a-9db4-97fd2132a416',
            },
            [
              {
                path: 'health_unit',
                model: 'HealthUnit',
                populate: [
                  {
                    path: 'services',
                    model: 'Service',
                    select: '-__v -created_at -updated_at -translations',
                  },
                ],
                select: '-__v -createdAt -updatedAt',
              },
            ]
          );
        } else if (app === 'marketplace') {
          user = await AuthenticationController.CustomersDAO.queryOne({
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
      if (app === 'business' && userJSON?.health_unit.stripe_information?.account_id) {
        connectedAccountId = userJSON.health_unit.stripe_information.account_id;

        externalAccounts = await AuthenticationController.StripeService.listExternalAccounts(
          connectedAccountId
        );
        userJSON.health_unit.stripe_information.external_accounts = externalAccounts.data;
      }

      let customerId;
      let paymentMethods;

      /**
       * Get Payment Methods from Stripe
       */
      if (app === 'marketplace') {
        customerId = (user as ICustomer).stripe_information?.customer_id;

        const default_payment_method = (
          (await AuthenticationController.StripeService.getCustomer(customerId)) as Stripe.Customer
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

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // TODO updateAccount
  static async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const user = await AuthenticationController.AuthHelper.getUserFromDB(accessToken);

      const userId = user._id;

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );
      let app: string = '';

      if (clientId === AWS_COGNITO_BUSINESS_CLIENT_ID) {
        app = 'business';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      const reqUser = req.body as ICustomerDocument | ICollaboratorDocument;
      let userExists;
      let updatedUser;

      // Check if user already exists by verifying the id
      try {
        userExists = await AuthenticationController.CollaboratorsDAO.retrieve(userId);

        // If user exists, update user
        if (userExists) {
          // The user to be updated is the user from the request body. For missing fields, use the user from the database.
          updatedUser = {
            ...userExists,
            ...user,
          };
          await AuthenticationController.CollaboratorsDAO.update(updatedUser);
        }
      } catch (error) {
        try {
          userExists = await AuthenticationController.CaregiversDAO.retrieve(userId);
          if (userExists) {
            // The user to be updated is the user from the request body. For missing fields, use the user from the database.
            updatedUser = {
              ...userExists,
              ...user,
            };
            await AuthenticationController.CaregiversDAO.update(updatedUser);
          }
        } catch (error) {
          try {
            userExists = await AuthenticationController.CustomersDAO.retrieve(userId);
            if (userExists) {
              // The user to be updated is the user from the request body. For missing fields, use the user from the database.
              updatedUser = {
                ...userExists,
                ...user,
              };
              await AuthenticationController.CustomersDAO.update(updatedUser);
            }
          } catch (error: any) {
            switch (error.type) {
              default:
                logger.warn('Error: ' + error);
            }
          }
        }
      }

      if (!userExists) {
        response.statusCode = 400;
        response.data = { message: 'User does not exist.' };

        logger.warn(
          'Users Controller updateUser error: ' + JSON.stringify(response, null, 2) + '\n'
        );

        next(response);
      } else {
        // Update user

        if (updatedUser) {
          response.statusCode = 200;
          response.data = updatedUser;

          logger.info(
            'USERS-DAO UPDATE_USER RESULT: ' + JSON.stringify(updatedUser, null, 2) + '\n'
          );

          next(response);
        }
      }
    } catch (error) {
      next(error);
    }
  }
}
