// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// lodash
import { omit } from 'lodash';

// @api
import { CompaniesDAO, HomeCareOrdersDAO, CompanyReviewsDAO, PatientsDAO } from '@api/v1/db';
import { AuthHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICompanyReview,
  IHomeCareOrder,
  ICompany,
  IQueryListResponse,
  IPatient,
} from '@api/v1/interfaces';
import { HTTPError } from '@api/v1/utils';
// @logger
import logger from '@logger';
import { PatientModel } from '../models';

export default class PatientsController {
  // db
  static CompanyReviewsDAO = new CompanyReviewsDAO();
  static CompaniesDAO = new CompaniesDAO();
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  static PatientsDAO = new PatientsDAO();
  // helpers
  static AuthHelper = AuthHelper;

  static async createCustomerPatient(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Creating a new patient');

      const response: IAPIResponse = {
        statusCode: res.statusCode,

        data: {},
      };

      const reqPatient = req.body as IPatient;

      const accessToken = req.headers['authorization']!.split(' ')[1];

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      reqPatient.customer = user._id;

      const patient = new PatientModel(reqPatient);

      const patientCreated = await this.PatientsDAO.create(patient);

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

      const patientID = req.params.id as string;
      const accessToken = req.headers['authorization']!.split(' ')[1];

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      const patient = await this.PatientsDAO.retrieve(patientID);

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

      const patientID = req.params.id;
      const accessToken = req.headers['authorization']!.split(' ')[1];

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      let patient = await this.PatientsDAO.retrieve(patientID);

      let reqPatient = req.body as IPatient;

      // Do not allow updating the user or the _id
      const sanitizedReqPatient = omit(reqPatient, ['customer', '_id']);

      const newPatient = {
        ...patient,
        ...sanitizedReqPatient,
      };

      const updatePation = new PatientModel(newPatient);

      if (patient?.customer?.toString() !== user._id.toString()) {
        next(new HTTPError._403('You are not allowed to access this resource'));
      }

      const patientUpdated = await this.PatientsDAO.update(updatePation);

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

      const patientID = req.params.id;
      const accessToken = req.headers['authorization']!.split(' ')[1];

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      const patient = await this.PatientsDAO.retrieve(patientID);

      if (patient?.customer?.toString() !== user._id.toString()) {
        throw new HTTPError._403('You are not allowed to access this resource');
      }

      const patientOrders = (await this.HomeCareOrdersDAO.queryList({ patient: patientID })).data;

      if (patientOrders.length > 0) {
        next(new HTTPError._403('You cannot delete a patient with associated orders'));
      }

      const patientDeleted = await this.PatientsDAO.delete(patientID);

      response.data = patientDeleted;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listPatientsByCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      const patients = await this.PatientsDAO.queryList({
        customer: user._id,
      });

      response.data = patients;
      response.statusCode = 200;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
