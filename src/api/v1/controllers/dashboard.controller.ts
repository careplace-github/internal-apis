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
} from 'src/packages/database';
import { AuthHelper, EmailHelper, StripeHelper } from '@packages/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IHealthUnitDocument,
} from 'src/packages/interfaces';
import { SESService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
import { CaregiverModel, CollaboratorModel } from '@packages/models';

export default class DashboardController {
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

  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];

      let user = await DashboardController.AuthHelper.getUserFromDB(accessToken);

      let healthUnitId = '';

      if (user instanceof CollaboratorModel || user instanceof CaregiverModel) {
        healthUnitId = user.health_unit._id.toString();
      } else {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (healthUnitId === null || healthUnitId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      let healthUnit = await DashboardController.HealthUnitsDAO.retrieve(healthUnitId);

      if (!healthUnit || !healthUnit.stripe_information) {
        next(new HTTPError._500('Failed to retrieve healthUnit information.'));
        return;
      }

      let accountId = healthUnit.stripe_information.account_id;

      let pendingOrders = await DashboardController.HomeCareOrdersDAO.queryList({
        health_unit: healthUnitId,
        status: 'new',
      }).then((orders) => {
        return orders.data.length;
      });

      let numberOfActiveClients;
      let monthly_billing;

      numberOfActiveClients =
        await DashboardController.StripeHelper.getConnectedAccountActiveClients(accountId);

      try {
        monthly_billing =
          await DashboardController.StripeHelper.getConnectedAccountCurrentMonthlyBilling(
            accountId
          );
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      response.statusCode = 200;
      response.data = {
        pending_orders: {
          value: pendingOrders !== null && pendingOrders !== undefined ? pendingOrders : 0,
        },
        active_clients:
          numberOfActiveClients !== null && numberOfActiveClients !== undefined
            ? numberOfActiveClients
            : 0,

        monthly_billing: {
          value: monthly_billing !== null && monthly_billing !== undefined ? monthly_billing : 0,
        },
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async getAnnualBilling(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];

      let user = await DashboardController.AuthHelper.getUserFromDB(accessToken);

      let healthUnitId = '';

      if (user instanceof CollaboratorModel || user instanceof CaregiverModel) {
        healthUnitId = user.health_unit._id.toString();
      } else {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (healthUnitId === null || healthUnitId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      let healthUnit = await DashboardController.HealthUnitsDAO.retrieve(healthUnitId);

      if (!healthUnit || !healthUnit.stripe_information) {
        next(new HTTPError._500('Failed to retrieve healthUnit information.'));
        return;
      }

      let accountId = healthUnit.stripe_information.account_id;

      let annualBilling;

      try {
        annualBilling = await DashboardController.StripeHelper.getConnectAccountTotalRevenueByMonth(
          accountId
        );
      } catch (error: any) {
        return next(new HTTPError._500(error.message));
      }

      response.statusCode = 200;
      response.data = {
        annual_billing: {
          value: annualBilling !== null && annualBilling !== undefined ? annualBilling : [],
        },
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
