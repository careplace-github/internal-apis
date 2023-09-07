// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  ServicesDAO,
} from '@packages/database';
import { AuthHelper } from '@packages/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
} from 'src/packages/interfaces';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';

export default class ServicesController {
  // db
  static ServicesDAO = new ServicesDAO();

  static async listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const options: QueryOptions<IHealthUnit> = {};

      const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

      if (req.query.sortBy) {
        if (req.query.sortBy === 'name') {
          // sort by healthUnit.business_profile.name
          options.sort = {
            name: req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
          };
        }
      } else {
        // by default sort by the name
        options.sort = {
          name: 1, // 1 = ascending, -1 = descending
        };
      }

      const services = await ServicesController.ServicesDAO.queryList(
        {},
        options,
        page,
        documentsPerPage
      );

      response.statusCode = 200;
      response.data = services;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
