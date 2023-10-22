// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';
// secure-random-password
import password from 'secure-random-password';

// @api
import {
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  CustomersDAO,
  HomeCareOrdersDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICustomer,
  ICustomerDocument,
  IHealthUnit,
  IHealthUnitDocument,
  IOrder,
  IOrderDocument,
} from 'src/packages/interfaces';
import { CognitoService, SESService } from 'src/packages/services';
import { HTTPError, AuthUtils } from '@utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CustomerModel, CollaboratorModel } from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';

export default class CustomersController {
  // db
  static CustomersDAO = new CustomersDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  // helpers
  static AuthHelper = AuthHelper;

  // utils
  static AuthUtils = AuthUtils;

  /**
   * @debug
   * @description
   */
  static async createHealthUnitCustomer(
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

      // Get the Customer data from the request body
      const reqCustomer = req.body as ICustomer;

      // Omit the fiels that are not allowed to be changed by the user.
      const sanitizedReqCustomer = omit(reqCustomer, ['_id', 'cognito_id', 'settings']);

      const user = await CustomersController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator. This is like the middleware ClientGuard('business') but it's good to have it here to avoid errors.
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only create a Customer for the health unit that they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to create a Customer.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let healthUnit: IHealthUnitDocument;

      let newCustomer: ICustomerDocument;
      let temporaryPassword: string | undefined;
      let cognitoCustomer: CognitoIdentityServiceProvider.SignUpResponse | undefined;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await CustomersController.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Health Unit not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // Add the health unit id to the Customer data.
      sanitizedReqCustomer.health_unit = healthUnit._id;

      const Customer = new CustomerModel(sanitizedReqCustomer);

      // Validate the Customer data.
      const validationError = Customer.validateSync({ pathsToSkip: ['cognito_id'] });
      // If there are validation errors, return them.
      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      // Remove any whitespace from the phone number.
      sanitizedReqCustomer.phone = sanitizedReqCustomer.phone!.replace(/\s/g, '');

      let existingCustomer: ICustomerDocument | undefined;

      try {
        // Check if the healthUnit already has a Customer with the same email.
        existingCustomer = await CustomersController.CustomersDAO.queryOne({
          email: sanitizedReqCustomer.email,
          health_unit: healthUnit._id,
        });
      } catch (error: any) {
        // Do nothing.
      }

      // If there is a Customer with the same email, return an error.
      if (existingCustomer) {
        return next(
          new HTTPError._409(
            `Health unit already has a Customer with the email: ${sanitizedReqCustomer.email}.`
          )
        );
      }

      try {
        // Add the Customer to the database.
        newCustomer = await CustomersController.CustomersDAO.create(Customer);
      } catch (error: any) {
        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('Customer already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 201;
      response.data = newCustomer;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listHealthUnitCustomers(
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

      // Get the Customer data from the request body
      const reqCustomer = req.body as ICustomer;

      const user = await CustomersController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator. This is like the middleware ClientGuard('business') but it's good to have it here to avoid errors.
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only list the Customers for the health unit that they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to list the Customers.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let customers;

      try {
        // Get the Customers for the health unit from MongoDB.
        customers = await CustomersController.CustomersDAO.queryList({
          health_unit: healthUnitId,
        });
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Customers not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = customers;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnitCustomer(
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

      // Get the Customer ID from the request parameters
      const customerID = req.params.id;

      // Check if the Customer ID is valid
      if (!customerID) {
        return next(new HTTPError._400('Missing required Customer ID.'));
      }

      // Retrieve the user from the access token
      const user = await CustomersController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only retrieve Customers for the health unit they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to retrieve Customers.
      if (!user.permissions.includes('orders_view')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let customer;

      try {
        // Retrieve the specific Customer for the health unit from MongoDB.
        customer = await CustomersController.CustomersDAO.queryOne({
          _id: customerID,
          health_unit: healthUnitId,
        });
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

      response.statusCode = 200;
      response.data = customer;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateHealthUnitCustomer(
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

      // Get the Customer ID from the request parameters
      const customerID = req.params.id;

      // Check if the Customer ID is valid
      if (!customerID) {
        return next(new HTTPError._400('Missing required Customer ID.'));
      }

      // Retrieve the user from the access token
      const user = await CustomersController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only update Customers for the health unit they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to update Customers.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      // Get the Customer data from the request body
      const reqCustomer = req.body as ICustomer;

      // Omit the fiels that are not allowed to be changed by the user.
      let sanitizedReqCustomer = omit(reqCustomer, [
        '_id',
        'cognito_id',
        'settings',
        'health_unit',
      ]);

      let customerExists: ICustomerDocument;

      try {
        // Get the Customer from MongoDB.
        customerExists = await CustomersController.CustomersDAO.retrieve(customerID);
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

      // Check if the Customer belongs to the health unit.
      if (customerExists?.health_unit?.toString() !== healthUnitId) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // fill in the missing fields from the existing Customer
      sanitizedReqCustomer = {
        ...customerExists.toObject(),
        ...sanitizedReqCustomer,
      };

      // Remove any whitespace
      sanitizedReqCustomer.phone = sanitizedReqCustomer.phone!.replace(/\s/g, '');

      const Customer = new CustomerModel(sanitizedReqCustomer);

      // Validate the Customer data.
      const validationError = Customer.validateSync({ pathsToSkip: ['cognito_id'] });

      // If there are validation errors, return them.
      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let updatedCustomer: ICustomerDocument;

      try {
        // Update the Customer in MongoDB.
        updatedCustomer = await CustomersController.CustomersDAO.update(Customer);
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

      response.statusCode = 200;
      response.data = updatedCustomer;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async deleteHealthUnitCustomer(
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

      // Get the Customer ID from the request parameters
      const customerID = req.params.id;

      // Check if the Customer ID is valid
      if (!customerID) {
        return next(new HTTPError._400('Missing required Customer ID.'));
      }

      // Retrieve the user from the access token
      const user = await CustomersController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only delete Customers for the health unit they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to delete Customers.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let customerExists: ICustomerDocument;

      try {
        // Get the Customer from MongoDB.
        customerExists = await CustomersController.CustomersDAO.retrieve(customerID);
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

      // Check if the Customer belongs to the health unit.
      if (customerExists?.health_unit?.toString() !== healthUnitId) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // Check if the Customer has any orders.
      let orders: IOrderDocument[] = [];

      try {
        // Get the orders for the Customer from MongoDB.
        orders = (
          await CustomersController.HomeCareOrdersDAO.queryList({
            customer: customerID,
            // active orders are orders that are not cancelled or declined
            status: { $nin: ['cancelled', 'declined'] },
          })
        ).data;
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            // Do nothing.
            break;
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the Customer has orders, return an error.
      if (orders.length > 0) {
        return next(
          new HTTPError._403(
            'You cannot delete a Customer that has active orders. Please delete the orders first.'
          )
        );
      }

      try {
        // Delete the Customer from MongoDB.
        await CustomersController.CustomersDAO.delete(customerID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Customer not found.'));
          }
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Customer deleted successfully.' };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
