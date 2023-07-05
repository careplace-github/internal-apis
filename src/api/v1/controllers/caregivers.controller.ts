// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';
// secure-random-password
import password from 'secure-random-password';

// @api
import {
  CaregiversDAO,
  CustomersDAO,
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  HomeCareOrdersDAO,
} from '@api/v1/db';
import { AuthHelper, EmailHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICaregiverModel,
  ICaregiver,
  IHealthUnit,
  IHealthUnitModel,
} from '@api/v1/interfaces';
import { CognitoService, SESService } from '@api/v1/services';
import { HTTPError, AuthUtils } from '@api/v1/utils';
// @constants
import { AWS_COGNITO_CRM_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CaregiverModel } from '../models';

export default class CaregiversController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();
  static CustomersDAO = new CustomersDAO();
  static CaregiversDAO = new CaregiversDAO();
  static HealthUnitsDAO = new HealthUnitsDAO();
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  // helpers
  static AuthHelper = AuthHelper;
  static EmailHelper = EmailHelper;
  // services
  static SES = SESService;
  static CognitoService = new CognitoService(AWS_COGNITO_CRM_CLIENT_ID);
  // utils
  static AuthUtils = AuthUtils;

  /**
   * @debug
   * @description
   */
  static async createHealthUnitCaregiver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const reqCregiver = req.body as ICaregiver;

      const caregiver = new CaregiverModel(reqCregiver);

      const healthUnitId = caregiver.health_unit.toString();

      let healthUnit: IHealthUnitModel | null = null;

      let newcaregiver: ICaregiverModel | null = null;
      let temporaryPassword: string | undefined;
      let cognitocaregiver: any;

      try {
        // Get the health_unit from MongoDB.
        healthUnit = await this.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('HealthUnit not found.'));
          }
        }
      }

      // Remove any whitespace from the phone number.
      caregiver.phone = caregiver.phone!.replace(/\s/g, '');

      // If the permission app_caregiver is included, create a new caregiver in the CRM Cognito caregiver Pool to allow them to login.
      if (caregiver?.permissions?.includes('app_user')) {
        // Generate a random password of 8 characters.
        temporaryPassword = String(
          password.randomPassword({
            characters: [password.lower, password.upper, password.digits],
            length: 8,
          })
        );

        // Create a new caregiver in the CRM Cognito caregiver Pool.
        try {
          cognitocaregiver = await this.CognitoService.addUser(
            caregiver.email,
            temporaryPassword,
            caregiver.phone
          );
        } catch (error: any) {
          switch (error.type) {
            case 'INVALID_PARAMETER': {
              return next(new HTTPError._400(error.message));
            }

            default: {
              return next(new HTTPError._500(error.message));
            }
          }
        }

        caregiver.cognito_id = cognitocaregiver.caregiverSub;

        try {
          // Confirm the caregiver in Cognito.
          const confirmcaregiver = this.CognitoService.adminConfirmUser(caregiver.email!);
        } catch (error: any) {
          switch (error.type) {
            case 'INVALID_PARAMETER': {
              return next(new HTTPError._400(error.message));
            }

            default: {
              return next(new HTTPError._500(error.message));
            }
          }
        }
      }

      try {
        // Add the caregiver to the database.
        newcaregiver = await this.CaregiversDAO.create(caregiver);
      } catch (error: any) {
        // If there was an error creating the caregiver in the database, delete the caregiver from Cognito.
        const deletecaregiver = await this.CognitoService.adminDeleteUser(caregiver.email);

        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('caregiver already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      try {
        const emailData = {
          name: caregiver.name,
          email: caregiver.email,
          healthUnit: healthUnit!.business_profile!.name!,
          password: temporaryPassword,
        };

        // Insert variables into email template
        let email = await EmailHelper.getEmailTemplateWithData('crm_new_caregiver', emailData);

        if (!email || !email.htmlBody || !email.subject) {
          throw new HTTPError._500('Error getting email template');
        }

        // Send email to caregiver
        this.SES.sendEmail([caregiver.email!], email.subject, email.htmlBody);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 201;
      response.data = newcaregiver;

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description
   */
  static async retrieveHealthUnitCaregiver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const caregiverId = req.params.id;

      let caregiver: ICaregiverModel | null = null;

      try {
        // Get caregiver by id
        caregiver = await this.CaregiversDAO.retrieve(caregiverId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = caregiver;

      // Pass to the next middleware to handle the response

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description
   */
  static async updateHealthUnitCaregiver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const caregiverId = req.params.id;
      const caregiver = req.body as ICaregiver;
      let caregiverExists: ICaregiver | null = null;
      let updatedcaregiver: ICaregiverModel | null = null;

      // Check if caregiver already exists by verifying the id
      try {
        caregiverExists = await this.CaregiversDAO.retrieve(caregiverId);

        // If caregiver exists, update caregiver
        if (caregiverExists) {
          // The caregiver to be updated is the caregiver from the request body. For missing fields, use the caregiver from the database.
          updatedcaregiver = new CaregiverModel({
            ...caregiverExists,
            ...caregiver,
          });
          // Update caregiver in the database
          await this.CaregiversDAO.update(updatedcaregiver);
        }
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = updatedcaregiver;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description
   */
  static async deleteHealthUnitCaregiver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const caregiverId = req.params.id;

      if (!caregiverId) {
        return next(new HTTPError._400('Missing caregiver id'));
      }

      let caregiver: ICaregiverModel | null = null;
      let isDeleted = false;

      try {
        // Try to retrieve caregiver from CaregiversDAO first
        caregiver = await this.CaregiversDAO.retrieve(caregiverId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // If caregiver exists, delete caregiver from the database
      if (caregiver) {
        try {
          const deletedcaregiver = await this.CaregiversDAO.delete(caregiverId);
          isDeleted = !!deletedcaregiver;
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the caregiver has access to the CRM, delete the caregiver from Cognito
      if (caregiver?.cognito_id) {
        try {
          await this.CognitoService.adminDeleteUser(caregiver.cognito_id);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = { message: 'caregiver deleted.' };

      // Pass to the next middleware to handle the response
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description
   */
  static async listHealthUnitCaregivers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let caregivers: ICaregiverModel[];

      let healthUnitId: string;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user = await AuthHelper.getUserFromDB(accessToken);

      healthUnitId = user.health_unit._id;

      try {
        caregivers = (
          await this.CaregiversDAO.queryList({
            health_unit: healthUnitId,
          })
        ).data;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = caregivers;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
