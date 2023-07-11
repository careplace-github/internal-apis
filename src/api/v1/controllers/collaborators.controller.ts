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
  ICollaboratorDocument,
  IHealthUnit,
  IHealthUnitDocument,
} from 'src/api/v1/interfaces';
import { CognitoService, SESService } from '@api/v1/services';
import { HTTPError } from 'src/utils';
import { AuthUtils } from '@api/v1/utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel } from '../models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';

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
  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);
  // utils
  static AuthUtils = AuthUtils;

  /**
   * @debug
   * @description
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const reqCollaborator = req.body as ICollaborator;
      const sanitizedReqCollaborator = omit(reqCollaborator, ['_id', 'cognito_id', 'settings']);

      const user = await CollaboratorsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const healthUnitId = user.health_unit._id.toString();

      if (!user.permissions.includes('users_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let healthUnit: IHealthUnitDocument;

      let newcollaborator: ICollaboratorDocument;
      let temporaryPassword: string | undefined;
      let cognitocollaborator: CognitoIdentityServiceProvider.SignUpResponse | undefined;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await CollaboratorsController.HealthUnitsDAO.retrieve(healthUnitId);
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

      sanitizedReqCollaborator.health_unit = healthUnit._id;

      // Remove any whitespace from the phone number.
      sanitizedReqCollaborator.phone = sanitizedReqCollaborator.phone!.replace(/\s/g, '');

      const collaborator = new CollaboratorModel(sanitizedReqCollaborator);

      // Validate the collaborator data.
      const validationError = collaborator.validateSync({ pathsToSkip: ['cognito_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let existingcollaborator: ICollaboratorDocument | undefined;
      // Check if the healthUnit already has a collaborator with the same email.
      try {
        existingcollaborator = await CollaboratorsController.CollaboratorsDAO.queryOne({
          email: sanitizedReqCollaborator.email,
          health_unit: healthUnit._id,
        });
      } catch (error: any) {
        // Do nothing.
      }

      if (existingcollaborator) {
        return next(
          new HTTPError._409(
            `Health unit already has a collaborator with the email: ${sanitizedReqCollaborator.email}.`
          )
        );
      }

      // If the permission app_collaborator is included, create a new collaborator in the BUSINESS Cognito collaborator Pool to allow them to login.
      if (sanitizedReqCollaborator?.permissions?.includes('app_user')) {
        /**
         * The user is trying to create a collaborator with the app_user permission.
         * This means that the user is trying to create a collaborator that can login to the app.
         * This means that we need to create a new user in the BUSINESS Cognito collaborator Pool.
         * The email is a unique identifier.
         * To prevent a user creating a collaborator that is from another health unit (if this happened another health unit couldn't create a collaborator with the same email),
         * one is onnly allowed to create a collaborator with the email that has the same domain as the health unit.
         */

        // Get the domain from the health unit email.
        const healthUnitEmailDomain = healthUnit.business_profile.email.split('@')[1];

        // Get the domain from the collaborator email.
        const collaboratorEmailDomain = sanitizedReqCollaborator.email.split('@')[1];

        // Check if the domains are the same.
        if (healthUnitEmailDomain !== collaboratorEmailDomain) {
          return next(
            new HTTPError._400(
              'The collaborator email domain is not the same as the health unit email domain.'
            )
          );
        }

        // Generate a random password of 8 characters.
        temporaryPassword = String(
          password.randomPassword({
            characters: [password.lower, password.upper, password.digits],
            length: 8,
          })
        );

        // Create a new collaborator in the BUSINESS Cognito collaborator Pool.
        try {
          cognitocollaborator = await CollaboratorsController.CognitoService.addUser(
            reqCollaborator.email,
            temporaryPassword,
            reqCollaborator.phone
          );
        } catch (error: any) {
          switch (error.type) {
            case 'DUPLICATE_KEY': {
              if (error.message === 'An account with the given email already exists.') {
                return next(new HTTPError._409(error.message));
              }

              return next(new HTTPError._400(error.message));
            }

            default: {
              return next(new HTTPError._500(error.message));
            }
          }
        }

        reqCollaborator.cognito_id = cognitocollaborator.UserSub;

        try {
          // Confirm the collaborator in Cognito.
          const confirmcollaborator = CollaboratorsController.CognitoService.adminConfirmUser(
            reqCollaborator.email!
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
      }

      try {
        // Add the collaborator to the database.
        newcollaborator = await CollaboratorsController.CollaboratorsDAO.create(collaborator);
      } catch (error: any) {
        // If there was an error creating the collaborator in the database, delete the collaborator from Cognito.
        const deletecollaborator = await CollaboratorsController.CognitoService.adminDeleteUser(
          reqCollaborator.email
        );

        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('collaborator already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the permission app_collaborator is included, send an email to the collaborator with their temporary password and login instructions.
      if (cognitocollaborator) {
        try {
          const emailData = {
            name: reqCollaborator.name,
            email: reqCollaborator.email,
            healthUnit: healthUnit!.business_profile!.name!,
            password: temporaryPassword,
          };

          // Insert variables into email template
          let email = await EmailHelper.getEmailTemplateWithData(
            'business_new_collaborator',
            emailData
          );

          if (!email || !email.htmlBody || !email.subject) {
            return next(new HTTPError._500('Error getting email template'));
          }

          // Send email to collaborator
          CollaboratorsController.SES.sendEmail(
            [reqCollaborator.email!],
            email.subject,
            email.htmlBody
          );
        } catch (error: any) {
          switch (error.type) {
            default: {
              return next(new HTTPError._500(error.message));
            }
          }
        }
      }

      response.statusCode = 201;
      response.data = newcollaborator;

      // Pass to the next middleware to handle the response
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

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_view')) {
        return next(new HTTPError._403('Forbidden'));
      }

      const collaboratorId = req.params.id;

      let collaborator: ICollaboratorDocument;

      try {
        // Get collaborator by id
        collaborator = await CollaboratorsController.CollaboratorsDAO.retrieve(collaboratorId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Collaborator not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (collaborator?.health_unit?.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('Forbidden'));
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
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const collaboratorId = req.params.id;
      const reqCollaborator = req.body;
      const sanitizedReqCollaborator = omit(reqCollaborator, [
        '_id',
        'cognito_id',
        'email',
        'phone',
        'health_unit',
        'settings',
      ]);

      let collaboratorExists: ICollaboratorDocument | null = null;
      let updatedcollaborator: ICollaboratorDocument | null = null;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_edit')) {
        return next(new HTTPError._403('Forbidden'));
      }

      // Check if collaborator already exists by verifying the id
      try {
        collaboratorExists = await CollaboratorsController.CollaboratorsDAO.retrieve(
          collaboratorId
        );

        if (collaboratorExists?.health_unit?.toString() !== user.health_unit._id.toString()) {
          return next(new HTTPError._403('Forbidden'));
        }

        // If collaborator exists, update collaborator
        if (collaboratorExists) {
          // The collaborator to be updated is the collaborator from the request body. For missing fields, use the collaborator from the database.
          const collaborator = new CollaboratorModel({
            ...collaboratorExists.toJSON(),
            ...sanitizedReqCollaborator,
          });

          // Validate collaborator
          const validationError = collaborator.validateSync();

          if (validationError) {
            return next(new HTTPError._400(validationError.message));
          }

          // Update collaborator in the database
          updatedcollaborator = await CollaboratorsController.CollaboratorsDAO.update(
            collaborator!
          );
        }
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Collaborator not found.'));
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
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const collaboratorId = req.params.id;

      if (!collaboratorId) {
        return next(new HTTPError._400('Missing collaborator id'));
      }

      let collaborator: ICollaboratorDocument | null = null;
      let isDeleted = false;

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_edit')) {
        return next(new HTTPError._403('Forbidden'));
      }

      try {
        // Try to retrieve collaborator from CollaboratorsDAO first
        collaborator = await CollaboratorsController.CollaboratorsDAO.retrieve(collaboratorId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Collaborator not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (collaborator?.health_unit?.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('Forbidden'));
      }

      // If collaborator exists, delete collaborator from the database
      if (collaborator) {
        try {
          const deletedCollaborator = await CollaboratorsController.CollaboratorsDAO.delete(
            collaboratorId
          );
          isDeleted = !!deletedCollaborator;
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the collaborator has access to the BUSINESS, delete the collaborator from Cognito
      if (collaborator?.cognito_id) {
        try {
          await CollaboratorsController.CognitoService.adminDeleteUser(collaborator.cognito_id);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Collaborator deleted.' };

      next(response);

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
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let collaborators: ICollaboratorDocument[];

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

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      healthUnitId = user.health_unit._id.toString();

      try {
        collaborators = (
          await CollaboratorsController.CollaboratorsDAO.queryList({
            health_unit: healthUnitId,
          })
        ).data;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = collaborators.length > 0 ? 200 : 204;
      response.data = collaborators;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
