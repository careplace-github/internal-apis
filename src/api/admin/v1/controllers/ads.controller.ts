// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';
// secure-random-password
import password from 'secure-random-password';

// @api
import { AdsDAO } from 'src/packages/database';
import { AuthHelper, EmailHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICollaboratorDocument,
  IAd,
  IAdDocument,
} from 'src/packages/interfaces';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { HTTPError, AuthUtils } from '@utils';
// @constants
import { AWS_COGNITO_BUSINESS_CLIENT_ID, AWS_COGNITO_MARKETPLACE_CLIENT_ID } from '@constants';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel, AdModel } from '@packages/models';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { omit } from 'lodash';
import { PATHS } from 'src/packages/routes';
import Stripe from 'stripe';

export default class AdminAdsController {
  // db

  static AdsDAO = new AdsDAO();

  // helpers
  static AuthHelper = AuthHelper;

  // services
  static SES = SESService;

  static StripeService = StripeService;

  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);

  // utils
  static AuthUtils = AuthUtils;

  static async adminCreateAd(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const reqAd = req.body as IAd;

      const sanitizedReqAd = omit(reqAd, ['_id', 'end_date']);

      let newAd = new AdModel(sanitizedReqAd);

      switch (reqAd.type) {
        case 1:
          // 2 weeks
          newAd.end_date = new Date(newAd.start_date.getTime() + 14 * 24 * 60 * 60 * 1000);

          break;

        case 2:
          // 1 month
          newAd.end_date = new Date(newAd.start_date.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;

        case 3:
          // 1 month
          newAd.end_date = new Date(newAd.start_date.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;

        default:
          return next(new HTTPError._400('Invalid ad type.'));
      }

      // Validate the ad data
      const validationError = newAd.validateSync({
        pathsToSkip: ['_id'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      try {
        newAd = await AdminAdsController.AdsDAO.create(newAd);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      response.statusCode = 201;
      response.data = newAd;

      // Send the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminUpdateAd(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const AdId = req.params.id;

      let Ad: IAdDocument | undefined;

      try {
        Ad = await AdminAdsController.AdsDAO.retrieve(AdId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('ad not found.'));
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      const reqAd = req.body as IAd;

      const sanitizedReqAd = omit(reqAd, ['_id']);

      const updateAd = {
        ...Ad.toJSON(),
        ...sanitizedReqAd,
      };

      const newAd = new AdModel({
        ...updateAd,
      });

      // Validate the ad data
      const validationError = newAd.validateSync({
        pathsToSkip: ['_id'],
      });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let updatedAd: IAdDocument | undefined;
      try {
        updatedAd = await AdminAdsController.AdsDAO.update(newAd);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500('Internal server error.'));
        }
      }

      response.statusCode = 200;
      response.data = updatedAd;

      // Send the response
      return next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminRetrieveAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const AdId = req.params.id;

      let Ad: IAdDocument;

      try {
        Ad = await AdminAdsController.AdsDAO.retrieve(AdId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('ad not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        ...Ad.toJSON(),
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminDeleteAd(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const AdId = req.params.id;

      let Ad: IAdDocument | undefined;

      try {
        Ad = await AdminAdsController.AdsDAO.retrieve(AdId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('ad not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      // delete the ad from the database
      try {
        await AdminAdsController.AdsDAO.delete(AdId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 204;
      response.data = {
        message: 'ad deleted successfully.',
      };

      // Send the response
      return next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async adminSearchAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const filters: FilterQuery<IAd> = {};
      const options: QueryOptions<IAd> = {};

      const page = typeof req.query.page === 'string' ? parseInt(req?.query?.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string'
          ? parseInt(req?.query?.documentsPerPage)
          : 10;

      if (req.query.sortBy === 'name') {
        // sort by Ad.business_profile.name
        options.sort = {
          'health_unit.business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
        };
      } else {
        // If the sortBy query parameter is not provided, then we will sort the results by rhw name in an ascending order.
        options.sort = {
          'health_unit.business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }

      if (req.query.type) {
        filters.type = req.query.type as string;
      }

      const Ads = await AdminAdsController.AdsDAO.queryList(
        filters,
        options,
        page,
        documentsPerPage,
        // populate the health_unit field

        {
          path: 'health_unit',
          populate: {
            path: 'business_profile',
            select: 'name',
          },
        }
      );

      response.statusCode = 200;
      response.data = {
        ...Ads,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
