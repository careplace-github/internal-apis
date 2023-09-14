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
  IHealthUnit,
  IHealthUnitDocument,
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
import { PATHS } from 'src/packages/routes';

export default class AdminHealthUnitsController {
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
  static async createHealthUnitCollaborator(
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

      const reqCollaborator = req.body as ICollaborator;
      // reqCollaborator.profile_picture = '';
      const healthUnitId = req.params.healthUnit;
      const sanitizedReqCollaborator = omit(reqCollaborator, ['_id', 'cognito_id', 'settings']);

      let healthUnit: IHealthUnitDocument;

      let newcollaborator: ICollaboratorDocument;
      let temporaryPassword: string | undefined;
      let cognitocollaborator: CognitoIdentityServiceProvider.SignUpResponse | undefined;

      try {
        // Get the healthUnit from MongoDB.
        healthUnit = await AdminHealthUnitsController.HealthUnitsDAO.retrieve(healthUnitId);
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

      logger.info(`COLLABORATOR VALIDATION: ${JSON.stringify(collaborator, null, 2)}`);

      // Validate the collaborator data.
      const validationError = collaborator.validateSync({ pathsToSkip: ['cognito_id'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let existingcollaborator: ICollaboratorDocument | undefined;
      // Check if the healthUnit already has a collaborator with the same email.
      try {
        existingcollaborator = await AdminHealthUnitsController.CollaboratorsDAO.queryOne({
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
        // Generate a random password of 8 characters.
        temporaryPassword = String(
          password.randomPassword({
            characters: [password.lower, password.upper, password.digits],
            length: 8,
          })
        );

        // Create a new collaborator in the BUSINESS Cognito collaborator Pool.
        try {
          cognitocollaborator = await AdminHealthUnitsController.CognitoService.addUser(
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

        collaborator.cognito_id = cognitocollaborator.UserSub;

        try {
          // Confirm the collaborator in Cognito.
          const confirmcollaborator = AdminHealthUnitsController.CognitoService.adminConfirmUser(
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
        // Set the email_verified attribute to true in Cognito.
        await AdminHealthUnitsController.CognitoService.adminVerifyEmail(reqCollaborator.email!);
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

      try {
        // Add the collaborator to the database.
        newcollaborator = await AdminHealthUnitsController.CollaboratorsDAO.create(collaborator);
      } catch (error: any) {
        // If there was an error creating the collaborator in the database, delete the collaborator from Cognito.
        const deletecollaborator = await AdminHealthUnitsController.CognitoService.adminDeleteUser(
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
            healthUnitName: healthUnit!.business_profile!.name!,
            password: temporaryPassword,
            link: PATHS.business.auth.login,
            website: PATHS.business.home,
            privacyPolicy: PATHS.business.privacyPolicy,
            termsAndConditions: PATHS.business.termsAndConditions,
          };

          // Insert variables into email template
          const email = await EmailHelper.getEmailTemplateWithData(
            'auth_business_invitation',
            emailData
          );

          if (!email || !email.htmlBody || !email.subject) {
            return next(new HTTPError._500('Error getting email template'));
          }

          // Send email to collaborator
          AdminHealthUnitsController.SES.sendEmail(
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

  static async searchHealthUnits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const filters: FilterQuery<IHealthUnit> = {};
      const options: QueryOptions<IHealthUnit> = {};

      const page = typeof req.query.page === 'string' ? parseInt(req?.query?.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string'
          ? parseInt(req?.query?.documentsPerPage)
          : 10;

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy) {
        if (req.query.sortBy === 'rating') {
          // sort by healthUnit.rating.average
          options.sort = {
            'rating.average': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }
        if (req.query.sortBy === 'price') {
          // sort by healthUnit.business_profile.average_hourly_rate
          options.sort = {
            'pricing.minimum_hourly_rate': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }

        if (req.query.sortBy === 'name') {
          // sort by healthUnit.business_profile.name
          options.sort = {
            'business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }

        if (req.query.sortBy === 'relevance') {
          // sort by healthUnit.business_profile.name
          options.sort = {
            'business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        } else {
          // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
          // Otherwise, we will by default sort the results by ascending order.
          options.sort = {
            [req.query.sortBy as string]: req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }
      } else {
        // If the sortBy query parameter is not provided, then we will sort the results by rhw name in an ascending order.
        options.sort = {
          'business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }

      // If the lat and lng query parameters are provided, we'll add them to the filter object.
      if (req.query.lat && req.query.lng) {
        // Convert the lat and lng query parameters to floats.
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);

        // If the lat and lng query parameters are valid numbers, then we'll add them to the filter object.
        if (!isNaN(lat) && !isNaN(lng)) {
          filters.service_area = {
            $geoIntersects: {
              $geometry: {
                type: 'Point',
                coordinates: [lat, lng],
              },
            },
          };
        }
      }

      // If the services query parameter is provided, we'll add it to the filter object.
      if (req.query.services) {
        const services = Array.isArray(req.query.services)
          ? req.query.services
          : // req.query.services=1,2,3 so we'll split it by comma and convert it to an array of strings.
            (req.query.services as string).split(',');

        filters.services = {
          $all: services,
        };
      }

      // If the minRating query parameter is provided, we'll add it to the filter object.
      if (req.query.minRating) {
        // Convert the minRating query parameter to a float.
        const minRating = Array.isArray(req.query.minRating)
          ? (req.query.minRating[0] as string)
          : (req.query.minRating as string);

        filters['rating.average'] = {
          ...filters['rating.average'],
          $gte: parseFloat(minRating),
        };
      }

      // If the maxRating query parameter is provided, we'll add it to the filter object.
      if (req.query.maxRating) {
        // Convert the maxRating query parameter to a float.
        const maxRating = Array.isArray(req.query.maxRating)
          ? (req.query.maxRating[0] as string)
          : (req.query.maxRating as string);

        filters['rating.average'] = {
          ...filters['rating.average'],
          $lte: parseFloat(maxRating),
        };
      }

      // If the maxPrice query parameter is provided, we'll add it to the filter object.
      if (req.query.maxPrice) {
        // Convert the maxPrice query parameter to a float.
        const maxPrice = Array.isArray(req.query.maxPrice)
          ? (req.query.maxPrice[0] as string)
          : (req.query.maxPrice as string);

        filters['pricing.minimum_hourly_rate'] = {
          ...filters['pricing.minimum_hourly_rate'],
          $lte: parseFloat(maxPrice),
        };
      }

      // If the minPrice query parameter is provided, we'll add it to the filter object.
      if (req.query.minPrice) {
        // Convert the minPrice query parameter to a float.
        const minPrice = Array.isArray(req.query.minPrice)
          ? (req.query.minPrice[0] as string)
          : (req.query.minPrice as string);

        filters['pricing.minimum_hourly_rate'] = {
          ...filters['pricing.minimum_hourly_rate'],
          $gte: parseFloat(minPrice),
        };
      }

      // If the name query parameter is provided, we'll add it to the filter object.
      if (req.query.name) {
        const nameSubstring = req.query.name as string;

        // Create a regular expression for a case-insensitive substring search.
        const nameRegex = new RegExp(nameSubstring, 'i');

        filters['business_profile.name'] = {
          $regex: nameRegex,
        };
      }

      const healthUnits = await AdminHealthUnitsController.HealthUnitsDAO.queryList(
        filters,
        options,
        page,
        documentsPerPage,
        undefined,
        '-plan -legal_information -team -stripe_information -billing_address -createdAt -updatedAt -__v'
      );

      response.statusCode = 200;
      response.data = healthUnits;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
