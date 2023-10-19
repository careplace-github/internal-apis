// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// lodash
import { omit } from 'lodash';

// @api/v1
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  PatientsDAO,
} from 'src/packages/database';
import { AuthHelper } from '@packages/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IOrder,
  IHealthUnit,
  IQueryListResponse,
  IPatient,
  IPatientDocument,
  IOrderDocument,
  IHealthUnitDocument,
} from 'src/packages/interfaces';
// @api/common
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
import { CollaboratorModel, PatientModel } from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

export default class PatientsController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  static PatientsDAO = new PatientsDAO();

  // helpers
  static AuthHelper = AuthHelper;

  // -------------------------------------------------- //
  //                     CUSTOMERS                      //
  // -------------------------------------------------- //

  static async createCustomerPatient(
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

      const reqPatient = req.body as IPatient;

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      reqPatient.customer = user._id;

      const patient = new PatientModel(reqPatient);

      // validate the patient
      const error = patient.validateSync();

      if (error) {
        return next(new HTTPError._400(error.message));
      }

      const patientCreated = await PatientsController.PatientsDAO.create(patient);

      response.statusCode = 201;
      response.data = patientCreated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveCustomerPatient(
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

      const patientID = req.params.id as string;

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      let patient: IPatient;

      try {
        patient = await PatientsController.PatientsDAO.retrieve(patientID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Patient not found'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (patient?.customer?.toString() !== user._id.toString()) {
        next(new HTTPError._403('You are not allowed to access this resource'));
      }

      response.statusCode = 200;
      response.data = patient;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateCustomerPatient(
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

      const patientID = req.params.id;

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      const patient = await PatientsController.PatientsDAO.retrieve(patientID);

      const reqPatient = req.body as IPatient;

      // Do not allow updating the user or the _id
      const sanitizedReqPatient = omit(reqPatient, ['customer', '_id']);

      logger.info(JSON.stringify(patient, null, 2));

      logger.info(JSON.stringify(sanitizedReqPatient, null, 2));

      const newPatient = {
        ...patient.toJSON(),
        ...sanitizedReqPatient,
      };

      logger.info(JSON.stringify(newPatient, null, 2));

      if (patient?.customer?.toString() !== user._id.toString()) {
        next(new HTTPError._403('You are not allowed to access this resource'));
      }

      const updatePatient = new PatientModel(newPatient);

      const patientUpdated = await PatientsController.PatientsDAO.update(updatePatient);

      response.statusCode = 200;
      response.data = patientUpdated;

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteCustomerPatient(
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

      const patientID = req.params.id;

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      let patient: IPatientDocument;

      try {
        patient = await PatientsController.PatientsDAO.retrieve(patientID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Patient not found'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (patient?.customer?.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You are not allowed to access this resource'));
      }

      // If the patient has orders, do not allow deleting
      const patientOrders = (
        await PatientsController.HomeCareOrdersDAO.queryList({ patient: patientID })
      ).data; // queryList returns 402 if no results so we don't need error handling

      if (patientOrders.length > 0) {
        return next(new HTTPError._409('You cannot delete a patient with associated orders'));
      }

      const patientDeleted = await PatientsController.PatientsDAO.delete(patientID);

      response.data = patientDeleted;
      response.statusCode = 200;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listCustomerPatients(
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

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      const patient = await PatientsController.PatientsDAO.queryList({
        customer: user._id,
      });

      response.data = patient;
      response.statusCode = patient.data.length > 0 ? 200 : 204;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // -------------------------------------------------- //
  //                     HEALTH UNITS                   //
  // -------------------------------------------------- //

  static async createHealthUnitPatient(
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

      // Get the Patient data from the request body
      const reqPatient = req.body as IPatient;

      // Omit the fiels that are not allowed to be changed by the user.
      const sanitizedReqPatient = omit(reqPatient, ['_id', 'cognito_id', 'settings']);

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator. This is like the middleware ClientGuard('business') but it's good to have it here to avoid errors.
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only create a Patient for the health unit that they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to create a Patient.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let healthUnit: IHealthUnitDocument;
      let newPatient: IPatientDocument;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await PatientsController.HealthUnitsDAO.retrieve(healthUnitId);
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

      // Add the health unit id to the Patient data.
      sanitizedReqPatient.health_unit = healthUnit._id;

      // Remove any whitespace from the phone number.
      sanitizedReqPatient.phone = sanitizedReqPatient.phone!.replace(/\s/g, '');

      const Patient = new PatientModel(sanitizedReqPatient);

      // Validate the Patient data.
      const validationError = Patient.validateSync({ pathsToSkip: ['health_unit'] });

      // If there are validation errors, return them.
      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      try {
        // Add the Patient to the database.
        newPatient = await PatientsController.PatientsDAO.create(Patient);
      } catch (error: any) {
        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('Patient already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 201;
      response.data = newPatient;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnitPatient(
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

      // Get the patient ID from the request parameters
      const patientID = req.params.id as string;

      // Validate the patient ID
      if (!patientID || !mongoose.isValidObjectId(patientID)) {
        return next(new HTTPError._400('Invalid patient ID.'));
      }

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator. This is like the middleware ClientGuard('business') but it's good to have it here to avoid errors.
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // Check if the user is authorized to perform this action.
      if (!user.permissions.includes('orders_view')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      // The user can only retrieve patient for the health unit they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      let patient: IPatientDocument;

      try {
        // Get the patient from MongoDB.
        patient = await PatientsController.PatientsDAO.queryOne({
          _id: patientID,
          health_unit: healthUnitId,
        });
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Patient not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = patient;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateHealthUnitPatient(
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
      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

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
      const reqPatient = req.body as IPatient;

      // Omit the fiels that are not allowed to be changed by the user.
      let sanitizedReqPatient = omit(reqPatient, [
        '_id',
        'cognito_id',
        'settings',
        'health_unit',
        'customer',
      ]);

      let patientExists: IPatientDocument;

      try {
        // Get the Customer from MongoDB.
        patientExists = await PatientsController.PatientsDAO.retrieve(customerID);
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
      if (patientExists?.health_unit?.toString() !== healthUnitId) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // fill in the missing fields from the existing Customer
      sanitizedReqPatient = {
        ...patientExists.toObject(),
        ...sanitizedReqPatient,
      };

      // Remove any whitespace
      sanitizedReqPatient.phone = sanitizedReqPatient.phone!.replace(/\s/g, '');

      const patient = new PatientModel(sanitizedReqPatient);

      // Validate the Customer data.
      const validationError = patient.validateSync({ pathsToSkip: ['cognito_id'] });

      // If there are validation errors, return them.
      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let updatedPatient: IPatientDocument;

      try {
        // Update the Customer in MongoDB.
        updatedPatient = await PatientsController.PatientsDAO.update(patient);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Patient not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = updatedPatient;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async deleteHealthUnitPatient(
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

      // Get the Patient ID from the request parameters
      const PatientID = req.params.id;

      // Check if the Patient ID is valid
      if (!PatientID) {
        return next(new HTTPError._400('Missing required Patient ID.'));
      }

      // Retrieve the user from the access token
      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only delete Patient for the health unit they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to delete Patient.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let PatientExists: IPatientDocument;

      try {
        // Get the Patient from MongoDB.
        PatientExists = await PatientsController.PatientsDAO.retrieve(PatientID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Patient not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // Check if the Patient belongs to the health unit.
      if (PatientExists?.health_unit?.toString() !== healthUnitId) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // Check if the Customer has any orders.
      let orders: IOrderDocument[] = [];

      try {
        // Get the orders for the Customer from MongoDB.
        orders = (
          await PatientsController.HomeCareOrdersDAO.queryList({
            patient: PatientID,
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
        // Delete the Patient from MongoDB.
        await PatientsController.PatientsDAO.delete(PatientID);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Patient not found.'));
          }
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Patient deleted successfully.' };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listHealthUnitPatients(
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
      const reqPatient = req.body as IPatient;

      const user = await PatientsController.AuthHelper.getUserFromDB(accessToken);

      // Check if the user is a Collaborator. This is like the middleware ClientGuard('business') but it's good to have it here to avoid errors.
      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // The user can only list the Patient for the health unit that they are associated with.
      const healthUnitId = user.health_unit._id.toString();

      // Check if the user has the permission to list the Patient.
      if (!user.permissions.includes('orders_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let Patient;

      try {
        // Get the Patient for the health unit from MongoDB.
        Patient = await PatientsController.PatientsDAO.queryList({
          health_unit: healthUnitId,
        });
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Patient not found.'));
          }
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = Patient;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
