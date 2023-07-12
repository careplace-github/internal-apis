// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// lodash
import { omit } from 'lodash';

// @api/v1
import { HealthUnitsDAO, HomeCareOrdersDAO, HealthUnitReviewsDAO, PatientsDAO } from '@api/v1/db';
import { AuthHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IPatient,
  IPatientDocument,
  IHomeCareOrderDocument,
} from 'src/api/v1/interfaces';
// @api/common
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
import { PatientModel } from '../models';

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

      let patient = await PatientsController.PatientsDAO.retrieve(patientID);

      let reqPatient = req.body as IPatient;

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

      const patients = await PatientsController.PatientsDAO.queryList({
        customer: user._id,
      });

      response.data = patients;
      response.statusCode = patients.data.length > 0 ? 200 : 204;

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

  // TODO createHealthUnitPatient
  static async createHealthUnitPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  // TODO retrieveHealthUnitPatient
  static async retrieveHealthUnitPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  // TODO updateHealthUnitPatient
  static async updateHealthUnitPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  // TODO deleteHealthUnitPatient
  static async deleteHealthUnitPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  // TODO listHealthUnitPatient
  static async listHealthUnitPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}
}
