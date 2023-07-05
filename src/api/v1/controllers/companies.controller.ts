// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';

// @api
import {
  CompaniesDAO,
  HomeCareOrdersDAO,
  CompanyReviewsDAO,
  CustomersDAO,
  CollaboratorsDAO,
  CaregiversDAO,
} from '@api/v1/db';
import { AuthHelper, EmailHelper, StripeHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICompanyReview,
  IHomeCareOrder,
  ICompany,
  IQueryListResponse,
} from '@api/v1/interfaces';
import { SESService } from '@api/v1/services';
import { HTTPError } from '@api/v1/utils';
// @logger
import logger from '@logger';

export default class CompaniesController {
  // db
  static CompanyReviewsDAO = new CompanyReviewsDAO();
  static CustomersDAO = new CustomersDAO();
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CaregiversDAO = new CaregiversDAO();
  static CompaniesDAO = new CompaniesDAO();
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  // helpers
  static AuthHelper = AuthHelper;
  static EmailHelper = EmailHelper;
  static StripeHelper = StripeHelper;
  // services
  static SES = new SESService();

  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];

      let user = await this.AuthHelper.getUserFromDB(accessToken);

      let companyId = user.company._id;

      if (companyId === null || companyId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      let company = await this.CompaniesDAO.retrieve(companyId);

      if (!company || !company.stripe_information) {
        next(new HTTPError._500('Failed to retrieve company information.'));
        return;
      }

      let accountId = company.stripe_information.account_id;

      let pendingOrders = await this.HomeCareOrdersDAO.queryList({
        company: companyId,
        status: 'new',
      }).then((orders) => {
        return orders.data.length;
      });

      let numberOfActiveClients;
      let MRR;
      let annualRevenue;

      numberOfActiveClients = await this.StripeHelper.getConnectedAccountActiveClients(accountId);

      try {
        MRR = await this.StripeHelper.getConnectedAccountCurrentMRR(accountId);
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      try {
        annualRevenue = await this.StripeHelper.getConnectAccountTotalRevenueByMonth(accountId);
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

  static async retrieve(req: Request, res: Response, next: NextFunction): Promise<void> {}

  static async searchCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let filters: FilterQuery<ICompany> = {};
      let options: QueryOptions<ICompany> = {};

      const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy) {
        if (req.query.sortBy === 'rating') {
          // sort by company.rating.average
          options.sort = {
            'rating.average': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }
        if (req.query.sortBy === 'price') {
          // sort by company.business_profile.average_hourly_rate
          options.sort = {
            'pricing.minimum_hourly_rate': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }

        if (req.query.sortBy === 'name') {
          // sort by company.business_profile.name
          options.sort = {
            'business_profile.name': req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }

        if (req.query.sortBy === 'relevance') {
          // sort by company.business_profile.name
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

      let companies = await this.CompaniesDAO.queryList(
        filters,
        options,
        page,
        documentsPerPage,
        undefined,
        '-plan -legal_information -team -stripe_information -billing_address -createdAt -updatedAt -__v'
      );

      response.statusCode = 200;
      response.data = companies;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
