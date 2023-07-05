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
} from '@api/v1/db';
import { AuthHelper, EmailHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICollaboratorModel,
  IHealthUnit,
  IHealthUnitModel,
} from '@api/v1/interfaces';
import { CognitoService, SESService } from '@api/v1/services';
import { HTTPError, AuthUtils } from '@api/v1/utils';
// @constants
import { AWS_COGNITO_CRM_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CollaboratorModel } from '../models';

export default class CollaboratorsController {
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
  static CognitoService = new CognitoService(AWS_COGNITO_CRM_CLIENT_ID);
  // utils
  static AuthUtils = AuthUtils;

  /**
   * @debug
   * @description
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const reqCollaborator = req.body as ICollaborator;

      const healthUnitId = reqCollaborator.health_unit!.toString(); // Convert to string if it's an ObjectId

      let healthUnit: IHealthUnitModel;

      let newcollaborator: ICollaboratorModel;
      let temporaryPassword: string | undefined;
      let cognitocollaborator: any;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await this.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND': {
            return next(new HTTPError._404('Health Unit not found.'));
          }
        }
      }

      // Remove any whitespace from the phone number.
      reqCollaborator.phone = reqCollaborator.phone!.replace(/\s/g, '');

      // If the permission app_collaborator is included, create a new collaborator in the CRM Cognito collaborator Pool to allow them to login.
      if (reqCollaborator?.permissions?.includes('app_user')) {
        // Generate a random password of 8 characters.
        temporaryPassword = String(
          password.randomPassword({
            characters: [password.lower, password.upper, password.digits],
            length: 8,
          })
        );

        // Create a new collaborator in the CRM Cognito collaborator Pool.
        try {
          cognitocollaborator = await this.CognitoService.addUser(
            reqCollaborator.email,
            temporaryPassword,
            reqCollaborator.phone
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

        reqCollaborator.cognito_id = cognitocollaborator.collaboratorSub;

        try {
          // Confirm the collaborator in Cognito.
          const confirmcollaborator = this.CognitoService.adminConfirmUser(reqCollaborator.email!);
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
        const collaborator = new CollaboratorModel(reqCollaborator);
        // Add the collaborator to the database.
        newcollaborator = await this.CollaboratorsDAO.create(collaborator);
      } catch (error: any) {
        // If there was an error creating the collaborator in the database, delete the collaborator from Cognito.
        const deletecollaborator = await this.CognitoService.adminDeleteUser(reqCollaborator.email);

        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('collaborator already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      try {
        const emailData = {
          name: reqCollaborator.name,
          email: reqCollaborator.email,
          healthUnit: healthUnit!.business_profile!.name!,
          password: temporaryPassword,
        };

        // Insert variables into email template
        let email = await EmailHelper.getEmailTemplateWithData('crm_new_collaborator', emailData);

        if (!email || !email.htmlBody || !email.subject) {
          return next(new HTTPError._500('Error getting email template'));
        }

        // Send email to collaborator
        this.SES.sendEmail([reqCollaborator.email!], email.subject, email.htmlBody);
      } catch (error: any) {
        switch (error.type) {
          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 201;
      response.data = newcollaborator;

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description Returns the collaborator information from the collaborator id in the request params
   */
  static async retrieve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const collaboratorId = req.params.id;

      let collaborator: ICollaboratorModel;

      try {
        // Get collaborator by id
        collaborator = await this.CollaboratorsDAO.retrieve(collaboratorId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = collaborator;

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
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const collaboratorId = req.params.id;
      const reqCollaborator = req.body;
      let collaboratorExists: ICollaborator | null = null;
      let updatedcollaborator: ICollaboratorModel | null = null;

      // Check if collaborator already exists by verifying the id
      try {
        collaboratorExists = await this.CollaboratorsDAO.retrieve(collaboratorId);

        // If collaborator exists, update collaborator
        if (collaboratorExists) {
          // The collaborator to be updated is the collaborator from the request body. For missing fields, use the collaborator from the database.
          const collaborator = new CollaboratorModel({
            ...collaboratorExists,
            ...reqCollaborator,
          });
          // Update collaborator in the database
          updatedcollaborator = await this.CollaboratorsDAO.update(collaborator!);
        }
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = updatedcollaborator;

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
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const collaboratorId = req.params.id;

      if (!collaboratorId) {
        return next(new HTTPError._400('Missing collaborator id'));
      }

      let collaborator: ICollaboratorModel | null = null;
      let isDeleted = false;

      try {
        // Try to retrieve collaborator from CollaboratorsDAO first
        collaborator = await this.CollaboratorsDAO.retrieve(collaboratorId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // If collaborator exists, delete collaborator from the database
      if (collaborator) {
        try {
          const deletedCollaborator = await this.CollaboratorsDAO.delete(collaboratorId);
          isDeleted = !!deletedCollaborator;
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the collaborator has access to the CRM, delete the collaborator from Cognito
      if (collaborator?.cognito_id) {
        try {
          await this.CognitoService.adminDeleteUser(collaborator.cognito_id);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Collaborator deleted.' };

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
  static async listCollaborators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let collaborators: ICollaboratorModel[];

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
        collaborators = (
          await this.CollaboratorsDAO.queryList({
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
      response.data = collaborators;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
