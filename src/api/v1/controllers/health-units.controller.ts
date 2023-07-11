// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  CustomersDAO,
  CollaboratorsDAO,
  CaregiversDAO,
} from '@api/v1/db';
import { AuthHelper, EmailHelper, StripeHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IHealthUnitDocument,
} from 'src/api/v1/interfaces';
import { SESService } from '@api/v1/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel } from '../models';

export default class HealthUnitsController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();
  static CustomersDAO = new CustomersDAO();
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CaregiversDAO = new CaregiversDAO();
  static HealthUnitsDAO = new HealthUnitsDAO();
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  // helpers
  static AuthHelper = AuthHelper;
  static EmailHelper = EmailHelper;
  static StripeHelper = StripeHelper;
  // services
  static SES = SESService;

  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];

      let user = await HealthUnitsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      let healthUnitId = user.health_unit._id.toString();

      if (healthUnitId === null || healthUnitId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      let healthUnit = await HealthUnitsController.HealthUnitsDAO.retrieve(healthUnitId);

      if (!healthUnit || !healthUnit.stripe_information) {
        next(new HTTPError._500('Failed to retrieve healthUnit information.'));
        return;
      }

      let accountId = healthUnit.stripe_information.account_id;

      let pendingOrders = await HealthUnitsController.HomeCareOrdersDAO.queryList({
        health_unit: healthUnitId,
        status: 'new',
      }).then((orders) => {
        return orders.data.length;
      });

      let numberOfActiveClients;
      let MRR;
      let annualRevenue;

      numberOfActiveClients = await HealthUnitsController.StripeHelper.getConnectedAccountActiveClients(accountId);

      try {
        MRR = await HealthUnitsController.StripeHelper.getConnectedAccountCurrentMRR(accountId);
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      try {
        annualRevenue = await HealthUnitsController.StripeHelper.getConnectAccountTotalRevenueByMonth(accountId);
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      response.statusCode = 200;
      response.data = {
        pending_orders: pendingOrders !== null && pendingOrders !== undefined ? pendingOrders : 0,
        active_clients:
          numberOfActiveClients !== null && numberOfActiveClients !== undefined
            ? numberOfActiveClients
            : 0,
        MRR: MRR !== null && MRR !== undefined ? MRR : 0,
        annual_revenue: annualRevenue !== null && annualRevenue !== undefined ? annualRevenue : [],
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const healthUnitId = req.params.id;

      let healthUnit: IHealthUnitDocument;

      try {
        healthUnit = await HealthUnitsController.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Health unit not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = healthUnit;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async searchAgencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let filters: FilterQuery<IHealthUnit> = {};
      let options: QueryOptions<IHealthUnit> = {};

      const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

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
          filters['service_area'] = {
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
          : [req.query.services as string];

        filters['services'] = {
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

      let healthUnits = await HealthUnitsController.HealthUnitsDAO.queryList(
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
