// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';

// @api
import { HealthUnitsDAO, HomeCareOrdersDAO, HealthUnitReviewsDAO, ServicesDAO } from '@api/v1/db';
import { AuthHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
} from 'src/api/v1/interfaces';
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
      const services = await ServicesController.ServicesDAO.queryList({});

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
