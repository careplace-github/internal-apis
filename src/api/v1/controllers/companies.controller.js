import crmUsersDAO from '../db/crmUsers.dao';
import ordersDAO from '../db/orders.dao';
import companiesDAO from '../db/companies.dao';
import CRUD from './crud.controller';

// Import logger
import logger from '../../../logs/logger';
import StripeService from '../services/stripe.service';
import stripeHelper from '../helpers/services/stripe.helper';

import authHelper from '../helpers/auth/auth.helper';

import * as Error from '../utils/errors/http/index';
import * as LayerError from '../utils/errors/layer/index';

export default class CompaniesController {
  static async create(req, res, next) {}

  static async retrieve(req, res, next) {
    let CompaniesDAO = new companiesDAO();
    let CompaniesCRUD = new CRUD(CompaniesDAO);

    await CompaniesCRUD.retrieve(req, res, next);
  }

  static async update(req, res, next) {
    try {
      let response = {};

      let companyId = await req.params.id;
      let company = req.body;
      let companyExists;
      let CompaniesDAO = new companiesDAO();

      try {
        companyExists = await CompaniesDAO.retrieve(companyId);
      } catch (err) {
        console.log(err);
        if (err.type === 'NOT_FOUND') {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }
      if (req.body.serviceArea && req.body.serviceArea.length !== 0) {
        company.serviceArea = req.body.serviceArea;
      }

      // Get the Event from the database and substitute the values that are in the request body.

      let updateCompany = {
        ...companyExists,
        ...company,
      };

      let updatedCompany = await CompaniesDAO.update(updateCompany);

      response.statusCode = 200;
      response.data = updatedCompany;

      next(response);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  static async searchCompanies(req, res, next) {
    let filters = {};
    let options = {};
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let documentsPerPage = parseInt(req.query.documentsPerPage);

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
          [req.query.sortBy]: req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
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
      filters['service_area'] = {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            //coordinates: [38.74733186331398, -9.28920997678132]
            coordinates: [parseFloat(req.query.lat), parseFloat(req.query.lng)],
          },
        },
      };
    }

    // If the services query parameter is provided, we'll add it to the filter object.
    if (req.query.services) {
      // Search for all companies that have all the services provided in the services query parameter. The company may have more services than the ones provided in the services query parameter.
      filters['services'] = {
        $all: req.query.services.split(','),
      };
    }

    // If the minRating query parameter is provided, we'll add it to the filter object.
    if (req.query.minRating) {
      filters['rating.average'] = {
        ...filters['rating.average'],
        $gte: parseFloat(req.query.minRating),
      };
    }

    // If the maxRating query parameter is provided, we'll add it to the filter object.
    if (req.query.maxRating) {
      filters['rating.average'] = {
        ...filters['rating.average'],
        $lte: parseFloat(req.query.maxRating),
      };
    }

    // If the maxPrice query parameter is provided, we'll add it to the filter object.
    if (req.query.maxPrice) {
      filters['pricing.minimum_hourly_rate'] = {
        ...filters['pricing.minimum_hourly_rate'],
        $lte: parseFloat(req.query.maxPrice),
      };
    }

    // If the minPrice query parameter is provided, we'll add it to the filter object.
    if (req.query.minPrice) {
      // Add the minPrice query parameter to the filter object without overriding the maxPrice query parameter.
      filters['pricing.minimum_hourly_rate'] = {
        ...filters['pricing.minimum_hourly_rate'],
        $gte: parseFloat(req.query.minPrice),
      };
    }

    let CompaniesDAO = new companiesDAO();
    let companies = await CompaniesDAO.queryList(
      filters,
      options,
      page,
      documentsPerPage,
      null,
      '-plan -legal_information -team -stripe_information -billing_address -createdAt -updatedAt -__v'
    );

    let response = {
      data: companies,
      statusCode: 200,
    };

    next(response);
  }
}
