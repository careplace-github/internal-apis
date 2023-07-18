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
import { AuthHelper } from '@packages/helpers';
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
import { CognitoService, StripeService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
// @constants
import { AWS_COGNITO_MARKETPLACE_CLIENT_ID, AWS_COGNITO_BUSINESS_CLIENT_ID } from '@constants';
import Stripe from 'stripe';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';

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

      logger.info('Client ID: ' + clientId);

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

      if (
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
      ) {
        return next(new HTTPError._400('Invalid client id.'));
      }

      const Cognito = new CognitoService(clientId);

      const username = email ? email : phone;

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

      logger.info('CLIENT ID: ' + clientId);

      const Cognito = new CognitoService(clientId);

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

      logger.info('CLIENT ID: ' + clientId);

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

      logger.debug('APP: ' + app);
      logger.info('APP: ' + app);

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

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );
      let app: string = '';

      if (clientId === AWS_COGNITO_BUSINESS_CLIENT_ID) {
        app = 'business';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      const reqUser = req.body as ICustomerDocument | ICollaboratorDocument | ICaregiverDocument;

      const sanitizedReqUser = omit(reqUser, ['_id', 'cognito_id', 'email', 'phone']);

      const updatedUserFields = {
        ...user.toJSON(),
        ...sanitizedReqUser,
      };

      let updatedUser: ICustomerDocument | ICollaboratorDocument | ICaregiverDocument | undefined;

      if (user instanceof CollaboratorModel) {
        const updateUser = new CollaboratorModel(updatedUserFields);

        // validate user
        const validationError = updateUser.validateSync();

        if (validationError) {
          return next(new HTTPError._400(validationError.message));
        }

        // Update user
        try {
          updatedUser = await AuthenticationController.CollaboratorsDAO.update(updateUser);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CaregiverModel) {
        const updateUser = new CaregiverModel(updatedUserFields);

        // validate user
        const validationError = updateUser.validateSync();

        if (validationError) {
          return next(new HTTPError._400(validationError.message));
        }

        // Update user
        try {
          updatedUser = await AuthenticationController.CaregiversDAO.update(updateUser);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CustomerModel) {
        const updateUser = new CustomerModel(updatedUserFields);

        // validate user
        const validationError = updateUser.validateSync();

        if (validationError) {
          return next(new HTTPError._400(validationError.message));
        }

        // Update user
        try {
          updatedUser = await AuthenticationController.CustomersDAO.update(updateUser);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = updatedUser;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async changeEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { email } = req.body as { email: string };

      if (!email) {
        return next(new HTTPError._400('Email is required.'));
      }

      const user = await AuthenticationController.AuthHelper.getUserFromDB(accessToken);

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.updateUserAttributes(user.email, [
          {
            Name: 'email',
            Value: email,
          },
        ]);
      } catch (error: any) {
        switch (error.code) {
          case 'UsernameExistsException':
            return next(new HTTPError._409('Email already exists.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Update user in DB
      if (user instanceof CollaboratorModel) {
        user.email = email;

        try {
          await AuthenticationController.CollaboratorsDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CaregiverModel) {
        user.email = email;

        try {
          await AuthenticationController.CaregiversDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CustomerModel) {
        user.email = email;

        try {
          await AuthenticationController.CustomersDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Email updated successfully.',
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async changePhone(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { phone } = req.body as { phone: string };

      if (!phone) {
        return next(new HTTPError._400('Phone is required.'));
      }

      const user = await AuthenticationController.AuthHelper.getUserFromDB(accessToken);

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.updateUserAttributes(user.email, [
          {
            Name: 'phone_number',
            Value: phone,
          },
        ]);
      } catch (error: any) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            return next(new HTTPError._400(error.message));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // Update user in DB
      if (user instanceof CollaboratorModel) {
        user.phone = phone;

        try {
          await AuthenticationController.CollaboratorsDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CaregiverModel) {
        user.phone = phone;

        try {
          await AuthenticationController.CaregiversDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      } else if (user instanceof CustomerModel) {
        user.phone = phone;

        try {
          await AuthenticationController.CustomersDAO.update(user);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Phone number updated successfully.',
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async sendConfirmEmailCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.sendUserAttributeVerificationCode(accessToken, 'email');
      } catch (error: any) {
        switch (error.code) {
          case 'UserNotFoundException':
            return next(new HTTPError._404('User not found.'));
          case 'InvalidParameterException':
            return next(new HTTPError._400('Invalid parameters.'));
          case 'NotAuthorizedException':
            return next(new HTTPError._401('Not authorized.'));

          default:
            return next(new HTTPError._500(error.message));
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
      next(error);
    }
  }

  static async sendConfirmPhoneCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.sendUserAttributeVerificationCode(accessToken, 'phone_number');
      } catch (error: any) {
        switch (error.code) {
          case 'UserNotFoundException':
            return next(new HTTPError._404('User not found.'));
          case 'InvalidParameterException':
            return next(new HTTPError._400('Invalid parameters.'));
          case 'NotAuthorizedException':
            return next(new HTTPError._401('Not authorized.'));

          default:
            return next(new HTTPError._500(error.message));
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
      next(error);
    }
  }

  static async verifyConfirmEmailCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      const { code } = req.body as { code: string };

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.verifyUserAttributeCode(accessToken, 'email', code);
      } catch (error: any) {
        switch (error.code) {
          case 'UserNotFoundException':
            return next(new HTTPError._404('User not found.'));
          case 'CodeMismatchException':
            return next(new HTTPError._400('Invalid code.'));
          case 'ExpiredCodeException':
            return next(new HTTPError._400('Code expired.'));
          case 'NotAuthorizedException':
            return next(new HTTPError._401('Not authorized.'));

          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Email confirmed successfully.',
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async verifyConfirmPhoneCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      const { code } = req.body as { code: string };

      let clientId = await AuthenticationController.AuthHelper.getClientIdFromAccessToken(
        accessToken
      );

      const Cognito = new CognitoService(clientId);

      try {
        await Cognito.verifyUserAttributeCode(accessToken, 'phone_number', code);
      } catch (error: any) {
        switch (error.type) {
          case 'INVALID_PARAMETER':
            return next(new HTTPError._400(error.message));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        message: 'Phone number confirmed successfully.',
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }
}
