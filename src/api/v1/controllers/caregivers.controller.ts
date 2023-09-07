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
  CaregiversDAO,
  HomeCareOrdersDAO,
} from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICaregiver,
  ICaregiverDocument,
  IHealthUnit,
  IHealthUnitDocument,
  IHomeCareOrder,
  IHomeCareOrderDocument,
} from 'src/packages/interfaces';
import { CognitoService, SESService } from 'src/packages/services';
import { HTTPError, AuthUtils } from '@utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel } from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';

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

  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

  // utils
  static AuthUtils = AuthUtils;

  /**
   * @debug
   * @description
   */
  static async createCaregiver(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const reqCaregiver = req.body as ICaregiver;
      const sanitizedReqCaregiver = omit(reqCaregiver, ['_id', 'cognito_id', 'settings']);

      const user = await CaregiversController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const healthUnitId = user.health_unit._id.toString();

      if (!user.permissions.includes('users_edit')) {
        throw new HTTPError._403('You are not authorized to perform this action.');
      }

      let healthUnit: IHealthUnitDocument;

      let newcaregiver: ICaregiverDocument;
      let temporaryPassword: string | undefined;
      let cognitocaregiver: CognitoIdentityServiceProvider.SignUpResponse | undefined;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await CaregiversController.HealthUnitsDAO.retrieve(healthUnitId);
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

      sanitizedReqCaregiver.health_unit = healthUnit._id;

      // Remove any whitespace from the phone number.
      sanitizedReqCaregiver.phone = sanitizedReqCaregiver?.phone?.replace(/\s/g, '') || '';

      sanitizedReqCaregiver.role = 'caregiver';

      const caregiver = new CaregiverModel(sanitizedReqCaregiver);

      // Validate the caregiver data.
      const validationError = caregiver.validateSync({ pathsToSkip: ['cognito_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let existingcaregiver: ICaregiverDocument | undefined;
      // Check if the healthUnit already has a caregiver with the same email.
      try {
        existingcaregiver = await CaregiversController.CaregiversDAO.queryOne({
          email: sanitizedReqCaregiver.email,
          health_unit: healthUnit._id,
        });
      } catch (error: any) {
        // Do nothing.
      }

      if (existingcaregiver) {
        return next(
          new HTTPError._409(
            `Health unit already has a caregiver with the email: ${sanitizedReqCaregiver.email}.`
          )
        );
      }

      // If the permission app_caregiver is included, create a new caregiver in the BUSINESS Cognito caregiver Pool to allow them to login.
      if (sanitizedReqCaregiver?.permissions?.includes('app_user')) {
        /**
         * The user is trying to create a caregiver with the app_user permission.
         * This means that the user is trying to create a caregiver that can login to the app.
         * This means that we need to create a new user in the BUSINESS Cognito caregiver Pool.
         * The email is a unique identifier.
         * To prevent a user creating a caregiver that is from another health unit (if this happened another health unit couldn't create a caregiver with the same email),
         * one is onnly allowed to create a caregiver with the email that has the same domain as the health unit.
         */

        // Get the domain from the health unit email.
        const healthUnitEmailDomain = healthUnit.business_profile.email.split('@')[1];

        // Get the domain from the caregiver email.
        const caregiverEmailDomain = sanitizedReqCaregiver.email.split('@')[1];

        // Check if the domains are the same.
        if (healthUnitEmailDomain !== caregiverEmailDomain) {
          return next(
            new HTTPError._400(
              'The caregiver email domain is not the same as the health unit email domain.'
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

        // Create a new caregiver in the BUSINESS Cognito caregiver Pool.
        try {
          cognitocaregiver = await CaregiversController.CognitoService.addUser(
            reqCaregiver.email,
            temporaryPassword,
            reqCaregiver.phone
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

        reqCaregiver.cognito_id = cognitocaregiver.UserSub;

        try {
          // Confirm the caregiver in Cognito.
          const confirmcaregiver = CaregiversController.CognitoService.adminConfirmUser(
            reqCaregiver.email!
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
        // Add the caregiver to the database.
        newcaregiver = await CaregiversController.CaregiversDAO.create(caregiver);
      } catch (error: any) {
        // If there was an error creating the caregiver in the database, delete the caregiver from Cognito.
        const deletecaregiver = await CaregiversController.CognitoService.adminDeleteUser(
          reqCaregiver.email
        );

        switch (error.type) {
          case 'DUPLICATE_KEY': {
            return next(new HTTPError._400('caregiver already exists.'));
          }

          default: {
            return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the permission app_caregiver is included, send an email to the caregiver with their temporary password and login instructions.
      if (cognitocaregiver) {
        try {
          const emailData = {
            name: reqCaregiver.name,
            email: reqCaregiver.email,
            healthUnit: healthUnit!.business_profile!.name!,
            password: temporaryPassword,
          };

          // Insert variables into email template
          const email = await EmailHelper.getEmailTemplateWithData(
            'business_new_caregiver',
            emailData
          );

          if (!email || !email.htmlBody || !email.subject) {
            return next(new HTTPError._500('Error getting email template'));
          }

          // Send email to caregiver
          CaregiversController.SES.sendEmail([reqCaregiver.email!], email.subject, email.htmlBody);
        } catch (error: any) {
          switch (error.type) {
            default: {
              return next(new HTTPError._500(error.message));
            }
          }
        }
      }

      response.statusCode = 201;
      response.data = newcaregiver;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * @debug
   * @description Returns the caregiver information from the caregiver id in the request params
   */
  static async retrieveCaregiver(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_view')) {
        return next(new HTTPError._403('Forbidden'));
      }

      const caregiverId = req.params.id;

      let caregiver: ICaregiverDocument;

      try {
        // Get caregiver by id
        caregiver = await CaregiversController.CaregiversDAO.retrieve(caregiverId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Caregiver not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (caregiver?.health_unit?.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('Forbidden'));
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
  static async updateCaregiver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const caregiverId = req.params.id;
      const reqCaregiver = req.body;
      const sanitizedReqCaregiver = omit(reqCaregiver, [
        '_id',
        'cognito_id',
        'health_unit',
        'settings',
      ]);

      let caregiverExists: ICaregiverDocument | null = null;
      let updatedcaregiver: ICaregiverDocument | null = null;

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

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_edit')) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      // Check if caregiver already exists by verifying the id
      try {
        caregiverExists = await CaregiversController.CaregiversDAO.retrieve(caregiverId);

        if (caregiverExists?.health_unit?.toString() !== user.health_unit._id.toString()) {
          return next(new HTTPError._403('Forbidden'));
        }

        // If caregiver exists, update caregiver
        if (caregiverExists) {
          // The caregiver to be updated is the caregiver from the request body. For missing fields, use the caregiver from the database.
          const caregiver = new CaregiverModel({
            ...caregiverExists.toJSON(),
            ...sanitizedReqCaregiver,
          });

          // Validate caregiver
          const validationError = caregiver.validateSync();

          if (validationError) {
            return next(new HTTPError._400(validationError.message));
          }

          // Update caregiver in the database
          updatedcaregiver = await CaregiversController.CaregiversDAO.update(caregiver!);
        }
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Caregiver not found.'));
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
  static async deleteCaregiver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const caregiverId = req.params.id;

      if (!caregiverId) {
        return next(new HTTPError._400('Missing caregiver id'));
      }

      let caregiver: ICaregiverDocument | null = null;
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

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('Forbidden'));
      }

      if (!user.permissions.includes('users_edit')) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      try {
        // Try to retrieve caregiver from CaregiversDAO first
        caregiver = await CaregiversController.CaregiversDAO.retrieve(caregiverId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Caregiver not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (caregiver?.health_unit?.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('Forbidden'));
      }

      // If the Caregiver is associated with an order do not allow deleting
      const orders = (
        await CaregiversController.HomeCareOrdersDAO.queryList({
          // queryList returns 402 if no results so we don't need error handling
          caregiver: caregiverId,
          // Status different from new, cancelled, completed
          status: { $nin: ['new', 'cancelled', 'declined', 'completed'] },
        })
      ).data;

      if (orders.length > 0) {
        return next(
          new HTTPError._400(
            'Caregiver is associated with an order and cannot be deleted.',
            'CaregiverIsAssociatedWithOrder'
          )
        );
      }

      // If caregiver exists, delete caregiver from the database
      if (caregiver) {
        try {
          const deletedCaregiver = await CaregiversController.CaregiversDAO.delete(caregiverId);
          isDeleted = !!deletedCaregiver;
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      // If the caregiver has access to the BUSINESS, delete the caregiver from Cognito
      if (caregiver?.cognito_id) {
        try {
          await CaregiversController.CognitoService.adminDeleteUser(caregiver.cognito_id);
        } catch (error: any) {
          switch (error.type) {
            default:
              return next(new HTTPError._500(error.message));
          }
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Caregiver deleted.' };

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
  static async listCaregivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let caregivers: ICaregiverDocument[];

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

      const user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      healthUnitId = user.health_unit._id.toString();

      try {
        caregivers = (
          await CaregiversController.CaregiversDAO.queryList({
            health_unit: healthUnitId,
          })
        ).data;
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = caregivers.length > 0 ? 200 : 204;
      response.data = caregivers;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
