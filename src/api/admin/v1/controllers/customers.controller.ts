// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';
// secure-random-password
import password from 'secure-random-password';

// @api
import {
  CustomersDAO,
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  HomeCareOrdersDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICollaboratorDocument,
  ICustomer,
  IHealthUnit,
  IHealthUnitDocument,
} from 'src/packages/interfaces';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { HTTPError, AuthUtils } from '@utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import {
  CaregiverModel,
  CollaboratorModel,
  CustomerModel,
  HealthUnitModel,
} from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';
import { PATHS } from 'src/packages/routes';
import Stripe from 'stripe';

export default class AdminCustomersController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();

  static CustomersDAO = new CustomersDAO();

  static CollaboratorsDAO = new CollaboratorsDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  // helpers
  static AuthHelper = AuthHelper;

  static EmailHelper = EmailHelper;

  // services
  static SES = SESService;

  static StripeService = StripeService;

  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

  // utils
  static AuthUtils = AuthUtils;

  static async adminCreateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const reqCustomer = req.body as ICustomer;
      reqCustomer.phone = '000000000';

      console.log('reqCustomer', reqCustomer);
      let newCustomer = new CustomerModel(reqCustomer);

      const validationError = newCustomer.validateSync({
        pathsToSkip: ['_id'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      try {
        newCustomer = await AdminCustomersController.CustomersDAO.create(newCustomer);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 201;
      response.data = newCustomer;

      // Send the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminUpdateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const customerID = req.url.split('/').at(-1);
      if (!customerID) {
        return next(new HTTPError._400('Missing required Customer ID.'));
      }
      try {
        // Get the Customer from MongoDB.
        await AdminCustomersController.CustomersDAO.retrieve(customerID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Customer not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      const reqCustomer = req.body as ICustomer;
      // set phonw '000000000' if customer has no phone
      if (!reqCustomer?.phone) reqCustomer.phone = '000000000';

      // Omit the fiels that are not allowed to be changed by the user.
      let sanitizedReqCustomer = omit(reqCustomer, [
        '_id',
        'cognito_id',
        'settings',
        'health_unit',
      ]);

      // Remove any whitespace
      sanitizedReqCustomer.phone = sanitizedReqCustomer?.phone?.replace(/\s/g, '');
      const customer = new CustomerModel(sanitizedReqCustomer);
      console.log('Customer --->', customer);

      // Validate the Customer data.
      const validationError = customer.validateSync({ pathsToSkip: ['cognito_id'] });

      // If there are validation errors, return them.
      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let updatedCustomer: ICustomer;

      try {
        // Update the Customer in MongoDB.
        // const prevCustomer = AdminCustomersController.CustomersDAO.retrieve(customer.id);
        console.log('Customer prev update ---->', customer);
        updatedCustomer = await AdminCustomersController.CustomersDAO.update(customer);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Customer not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }
      response.statusCode = 201;
      response.data = updatedCustomer;

      // Send the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
