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
  IOrder,
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

      const accessToken = req.headers.authorization!.split(' ')[1];

      const user = await DashboardController.AuthHelper.getUserFromDB(accessToken);

      let healthUnitId = '';

      if (user instanceof CollaboratorModel || user instanceof CaregiverModel) {
        healthUnitId = user.health_unit._id.toString();
      } else {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (healthUnitId === null || healthUnitId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      const healthUnit = await DashboardController.HealthUnitsDAO.retrieve(healthUnitId);

      if (!healthUnit || !healthUnit.stripe_information) {
        next(new HTTPError._500('Failed to retrieve healthUnit information.'));
        return;
      }

      const accountId = healthUnit.stripe_information.account_id;

      const pendingOrders = await DashboardController.HomeCareOrdersDAO.queryList({
        health_unit: { $eq: healthUnitId },
        status: { $eq: 'new' },
      }).then((orders) => orders.data);

      // ----------------------------------------------------------------------------------------- //
      const currentYear = new Date().getFullYear();
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1); // Set the date to the first day of the month
      currentMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00

      const previousMonthStart = new Date(); // Initialize a new date object
      previousMonthStart.setDate(1); // Set the date to the first day of the month
      previousMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1); // Set the month to the previous month

      const currentYearChargesPromise = StripeHelper.getChargesByConnectedAccountId(accountId, {
        status: 'succeeded',
        created: {
          gte: Math.floor(new Date().setFullYear(new Date().getFullYear() - 1) / 1000),
        },
      });

      const previousYearChargesPromise = StripeHelper.getChargesByConnectedAccountId(accountId, {
        status: 'succeeded',
        created: {
          gte: Math.floor(new Date(currentYear - 1, 0, 1).getTime() / 1000),
          lt: Math.floor(new Date(currentYear, 0, 1).getTime() / 1000),
        },
      });

      const currentYearCreatedSubscriptionsPromise =
        StripeHelper.getSubscriptionsByConnectedAcountId(accountId, {
          created: {
            gte: Math.floor(new Date().setFullYear(new Date().getFullYear() - 1) / 1000),
            lte: Math.floor(new Date().getTime() / 1000),
          },
          status: 'active',
        });

      const previousYearCreatedSubscriptionsPromise =
        StripeHelper.getSubscriptionsByConnectedAcountId(accountId, {
          created: {
            gte: Math.floor(new Date(currentYear - 1, 0, 1).getTime() / 1000),
            lt: Math.floor(new Date(currentYear, 0, 1).getTime() / 1000),
          },
          status: 'active',
        });

      const [
        currentYearCreatedSubscriptions,
        previousYearCreatedSubscriptions,
        currentYearCharges,
        previousYearCharges,
      ] = await Promise.all([
        currentYearCreatedSubscriptionsPromise,
        previousYearCreatedSubscriptionsPromise,
        currentYearChargesPromise,
        previousYearChargesPromise,
      ]);

      // Filter the subscriptions by the current month by comparing the created_at (unix timestamp) to the current month
      const currentMonthCreatedSubscriptions = currentYearCreatedSubscriptions.filter(
        (subscription) => {
          const currentMonth = new Date().getMonth();
          const subscriptionDate = new Date(subscription.created * 1000);

          return (
            subscriptionDate.getMonth() === currentMonth &&
            subscriptionDate.getFullYear() === currentYear
          );
        }
      );

      const previousMonthCreatedSubscriptions = previousYearCreatedSubscriptions.filter(
        (subscription) => {
          const previousMonth = new Date().getMonth() - 1;
          const subscriptionDate = new Date(subscription.created * 1000);

          return (
            subscriptionDate.getMonth() === previousMonth &&
            subscriptionDate.getFullYear() === currentYear
          );
        }
      );

      // Filter the charges by the current month by comparing the created_at (unix timestamp) to the current month
      const currentMonthCharges = currentYearCharges.data.filter((charge) => {
        const currentMonth = new Date().getMonth();
        const chargeDate = new Date(charge.created * 1000);

        return chargeDate.getMonth() === currentMonth && chargeDate.getFullYear() === currentYear;
      });

      const previousMonthCharges = currentYearCharges.data.filter((charge) => {
        const previousMonth = new Date().getMonth() - 1;
        const chargeDate = new Date(charge.created * 1000);

        return chargeDate.getMonth() === previousMonth && chargeDate.getFullYear() === currentYear;
      });

      let currentMonthChargesAmount = currentMonthCharges.reduce(
        (total, charge) => total + charge.amount,
        0
      );

      currentMonthChargesAmount /= 100; // Convert from cents to dollars

      let previousMonthChargesAmount = previousMonthCharges.reduce(
        (total, charge) => total + charge.amount,
        0
      );

      previousMonthChargesAmount /= 100; // Convert from cents to dollars

      let currentYearChargesAmount = currentYearCharges.data.reduce(
        (total, charge) => total + charge.amount,
        0
      );

      currentYearChargesAmount /= 100; // Convert from cents to dollars

      let previousYearChargesAmount = previousYearCharges.data.reduce(
        (total, charge) => total + charge.amount,
        0
      );

      previousYearChargesAmount /= 100; // Convert from cents to dollars

      // ------- ACTIVE CLIENTS ------- //

      const currentMonthClients = currentMonthCharges.length;
      const previousMonthClients = previousMonthCharges.length;

      let activeClientsMonthOverMonthPercentage = 0;

      if (previousMonthClients !== 0) {
        activeClientsMonthOverMonthPercentage =
          ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100;
      }

      // Initialize an object to store the counts for each month
      const activeClientsByMonth = currentYearCharges.data.reduce((accumulator, charge) => {
        const chargeDate = new Date(charge.created * 1000);
        const month = chargeDate.getMonth();

        // If the month key already exists, increment the count; otherwise, initialize it
        accumulator[month] = (accumulator[month] || 0) + 1;

        return accumulator;
      }, {});

      const activeClientsByMonthHighestMonthIndex = Math.max(
        ...Object.keys(activeClientsByMonth).map(Number)
      );

      for (let i = 1; i < activeClientsByMonthHighestMonthIndex; i++) {
        if (!(i in activeClientsByMonth)) {
          activeClientsByMonth[i] = 0;
        }
      }

      const activeClientsByMonthArray = Object.values(activeClientsByMonth);

      // remove the last element of the array (index)
      activeClientsByMonthArray.pop();

      // FIXME: this is a temporary fix to remove the last elements of the array if they are 0
      let lastNonZeroIndex = activeClientsByMonthArray.length - 1;
      while (lastNonZeroIndex >= 0 && activeClientsByMonthArray[lastNonZeroIndex] === 0) {
        lastNonZeroIndex--;
      }

      // Create a new array with non-zero elements
      const trimmedArray = activeClientsByMonthArray.slice(0, lastNonZeroIndex + 1);

      const activeClientsData = {
        value: Number(currentMonthClients.toFixed(2)),
        month_over_month_percentage: Number(activeClientsMonthOverMonthPercentage.toFixed(2)),
        active_clients_by_month: trimmedArray,
        test: activeClientsByMonth,
      };

      // ------- ACTIVE CLIENTS ------- //

      // ------- MONTHLY BILLING ------- //

      let monthlyBiilingMonthOverMonthPercentage = 0;

      if (previousMonthChargesAmount !== 0) {
        monthlyBiilingMonthOverMonthPercentage =
          ((currentMonthChargesAmount - previousMonthChargesAmount) / previousMonthChargesAmount) *
          100;
      }

      const monthlyBillingData = {
        value: Number(currentMonthChargesAmount.toFixed(2)),
        month_over_month_percentage: Number(monthlyBiilingMonthOverMonthPercentage.toFixed(2)),
      };

      // ------- MONTHLY BILLING ------- //

      // ------- YEAR TO DATE BILLING ------- //

      let yearOverYearPercentage = 0;

      if (previousYearChargesAmount !== 0) {
        yearOverYearPercentage =
          ((currentYearChargesAmount - previousYearChargesAmount) / previousYearChargesAmount) *
          100;
      }

      const yearToDateBillingData = {
        value: Number(currentYearChargesAmount.toFixed(2)),
        year_over_year_percentage: Number(yearOverYearPercentage.toFixed(2)),
      };

      // ------- YEAR TO DATE BILLING ------- //

      // -------- ORDERS AVERAGE -------- //

      const current_year_order_average = currentYearChargesAmount / currentYearCharges.data.length;
      const previous_year_order_average =
        previousYearChargesAmount / previousYearCharges.data.length;

      const yearly_order_average_month_over_month_percentage =
        ((current_year_order_average - previous_year_order_average) / previous_year_order_average) *
        100;

      // Calculate the average order amount for each month
      const order_average_by_month = currentYearCharges.data.reduce((accumulator, charge) => {
        const chargeDate = new Date(charge.created * 1000);
        const month = chargeDate.getMonth();

        // If the month key already exists, increment the count and total amount; otherwise, initialize it
        if (accumulator[month]) {
          accumulator[month].count += 1;
          accumulator[month].totalAmount += charge.amount;
        } else {
          accumulator[month] = {
            count: 1,
            totalAmount: charge.amount,
          };
        }

        return accumulator;
      }, {});

      // Calculate the average amount for each month and store it in an array
      const monthly_order_average_by_month = Object.keys(order_average_by_month).map((month) => {
        const { count, totalAmount } = order_average_by_month[month];
        return Number((totalAmount / 100 / count).toFixed(2));
      });

      const monthlyOrderAverageByMonthHighestMonthIndex = Math.max(
        ...Object.keys(monthly_order_average_by_month).map(Number)
      );

      for (let i = 1; i < monthlyOrderAverageByMonthHighestMonthIndex; i++) {
        if (!(i in monthly_order_average_by_month)) {
          monthly_order_average_by_month[i] = 0;
        }
      }

      // Remove the last element of the array (index)
      monthly_order_average_by_month.pop();

      const current_month_order_average = Number(
        monthly_order_average_by_month[monthly_order_average_by_month.length - 1].toFixed(2)
      );
      const previous_month_order_average = Number(
        monthly_order_average_by_month[monthly_order_average_by_month.length - 2].toFixed(2)
      );

      const monthly_order_average_month_over_month_percentage =
        ((current_month_order_average - previous_month_order_average) /
          previous_month_order_average) *
        100;

      const ordersAverageData = {
        current_year_order_average: Number(current_year_order_average.toFixed(2)),
        previous_year_order_average: Number(previous_year_order_average.toFixed(2)),
        yearly_order_average_month_over_month_percentage: Number(
          yearly_order_average_month_over_month_percentage.toFixed(2)
        ),
        current_month_order_average,
        previous_month_order_average,
        monthly_order_average_month_over_month_percentage: Number(
          monthly_order_average_month_over_month_percentage.toFixed(2)
        ),
        order_average_by_month: monthly_order_average_by_month,
        test: order_average_by_month,
      };

      // -------- ORDERS AVERAGE -------- //

      // --------- NEW CLIENTS --------- //

      // Initialize an object to store the counts for each month
      const newClientsByMonth = currentYearCreatedSubscriptions.reduce(
        (accumulator, subscription) => {
          const subscriptionDate = new Date(subscription.created * 1000);
          const month = subscriptionDate.getMonth();

          // If the month key already exists, increment the count; otherwise, initialize it
          accumulator[month] = (accumulator[month] || 0) + 1;

          return accumulator;
        },
        {}
      );

      const newClientsByMonthHighestMonthIndex = Math.max(
        ...Object.keys(newClientsByMonth).map(Number)
      );

      for (let i = 1; i < newClientsByMonthHighestMonthIndex; i++) {
        if (!(i in newClientsByMonth)) {
          newClientsByMonth[i] = 0;
        }
      }

      const newClientsByMonthArray = Object.values(newClientsByMonth);

      const currentMonthNewClients = newClientsByMonthArray[
        newClientsByMonthArray.length - 1
      ] as number;
      const previousMonthNewClients = newClientsByMonthArray[
        newClientsByMonthArray.length - 2
      ] as number;

      let monthOverMonthPercentage = 0;

      if (previousMonthNewClients !== 0) {
        monthOverMonthPercentage =
          ((currentMonthNewClients - previousMonthNewClients) / previousMonthNewClients) * 100;
      }

      const newClientsData = {
        value: Number(currentMonthNewClients.toFixed(2)),
        month_over_month_percentage: Number(monthOverMonthPercentage.toFixed(2)),
        new_clients_by_month: newClientsByMonthArray,
        test: newClientsByMonth,
      };

      // --------- NEW CLIENTS --------- //

      response.statusCode = 200;
      response.data = {
        pending_orders: {
          value: pendingOrders.length || 0,
          orders: pendingOrders,
        },
        active_clients: activeClientsData,

        year_to_date_billing: yearToDateBillingData,

        monthly_billing: monthlyBillingData,

        orders_average: ordersAverageData,

        new_clients: newClientsData,
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

      const accessToken = req.headers.authorization!.split(' ')[1];

      const user = await DashboardController.AuthHelper.getUserFromDB(accessToken);

      let healthUnitId = '';

      if (user instanceof CollaboratorModel || user instanceof CaregiverModel) {
        healthUnitId = user.health_unit._id.toString();
      } else {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (healthUnitId === null || healthUnitId === undefined) {
        return next(new HTTPError._401('Missing required access token.'));
      }

      const healthUnit = await DashboardController.HealthUnitsDAO.retrieve(healthUnitId);

      if (!healthUnit || !healthUnit.stripe_information) {
        next(new HTTPError._500('Failed to retrieve healthUnit information.'));
        return;
      }

      const accountId = healthUnit.stripe_information.account_id;

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
