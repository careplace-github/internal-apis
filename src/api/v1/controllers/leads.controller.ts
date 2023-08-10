// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// lodash
import { omit, pick } from 'lodash';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  CustomersDAO,
  EventsDAO,
  EventSeriesDAO,
  LeadsDAO,
} from '@packages/database';
import { AuthHelper, OrdersHelper, CalendarHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICustomer,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IEvent,
  IEventDocument,
  IEventSeriesDocument,
  IEventSeries,
} from 'src/packages/interfaces';
import {
  CaregiverModel,
  CollaboratorModel,
  EventModel,
  EventSeriesModel,
  LeadModel,
} from 'src/packages/models';
import { CognitoService, StripeService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
export default class CalendarController {
  // db
  static LeadsDAO = new LeadsDAO();

  static async createCaregiverLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { name, email, phone } = req.body;

      const newCaregiverLead = new LeadModel({
        type: 'caregiver',
        name,
        email,
        phone,
      });

      // validate the event
      const validationError = newCaregiverLead.validateSync({ pathsToSkip: ['_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      const caregiverLeadAdded = await this.LeadsDAO.create(newCaregiverLead);

      response.statusCode = 201;
      response.data = caregiverLeadAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async createHealthUnitLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { name, email, phone, company, company_type, company_size, role, message } = req.body;

      const newHealthUnitLead = new LeadModel({
        type: 'health_unit',
        name,
        email,
        phone,
        company,
        company_type,
        company_size,
        role,
        message,
      });

      // validate the event
      const validationError = newHealthUnitLead.validateSync({ pathsToSkip: ['_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      const healthUnitLeadAdded = await this.LeadsDAO.create(newHealthUnitLead);

      response.statusCode = 201;
      response.data = healthUnitLeadAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async createCustomerNewsletterLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { name, email } = req.body;

      const newCustomerNewsletterLead = new LeadModel({
        type: 'customer_newsletter',
        name,
        email,
      });

      // validate the event
      const validationError = newCustomerNewsletterLead.validateSync({ pathsToSkip: ['_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      const customerNewsletterLeadAdded = await this.LeadsDAO.create(newCustomerNewsletterLead);

      response.statusCode = 201;
      response.data = customerNewsletterLeadAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async createCollaboratorNewsletterLead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { name, email } = req.body;

      const newCollaboratorNewsletterLead = new LeadModel({
        type: 'collaborator_newsletter',
        name,
        email,
      });

      // validate the event
      const validationError = newCollaboratorNewsletterLead.validateSync({ pathsToSkip: ['_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      const collaboratorNewsletterLeadAdded = await this.LeadsDAO.create(
        newCollaboratorNewsletterLead
      );

      response.statusCode = 201;
      response.data = collaboratorNewsletterLeadAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
