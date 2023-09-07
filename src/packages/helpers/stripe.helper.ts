import { StripeService } from '@packages/services';

import { LayerError } from '@utils';
import axios from 'axios';
import logger from '@logger';

import fs from 'fs';

import * as regression from 'regression';

import { STRIPE_APPLICATION_FEE } from '@constants';
import Stripe from 'stripe';

export default class StripeHelper {
  static Stripe = StripeService;

  static async getSubscriptionsByConnectedAcountId(
    accountId: string,
    filters?: Stripe.SubscriptionListParams,
    lastSubscriptionId?: string
  ) {
    const options = {
      ...filters,
      limit: 100,
    };

    if (lastSubscriptionId) {
      options.starting_after = lastSubscriptionId;
    }

    try {
      const subscriptions = await this.Stripe.listSubscriptions(options);

      // If there are more subscriptions, fetch the next page
      if (subscriptions.has_more) {
        const lastSubscription = subscriptions.data[subscriptions.data.length - 1];
        const moreSubscriptions = await this.getSubscriptionsByConnectedAcountId(
          accountId,
          filters,
          lastSubscription?.id
        );
        subscriptions.data.push(...moreSubscriptions);
      }

      // Filter the subscriptions by the connected account id

      subscriptions.data = subscriptions.data.filter(
        (subscription) => subscription.transfer_data?.destination === accountId
      );

      return subscriptions.data;
    } catch (error) {
      throw error;
    }
  }

  static async getReceiptLink(subscriptionId) {
    const subscription = await this.Stripe.getSubscription(subscriptionId);

    if (!subscription.latest_invoice) {
      throw new LayerError.INTERNAL_ERROR('The subscription does not have an invoice');
    }

    const invoice = await this.Stripe.getInvoice(subscription.latest_invoice as string);

    if (!invoice.charge) {
      throw new LayerError.INTERNAL_ERROR('The invoice does not have a charge');
    }

    const charge = await this.Stripe.getCharge(invoice.charge as string);

    const receiptUrl = `${charge?.receipt_url?.replace('?s=ap', '')}/pdf?s=em`;

    return receiptUrl;
  }

  static async getOrderNumber(subscriptionId) {
    const subscription = await this.Stripe.getSubscription(subscriptionId);

    if (!subscription.latest_invoice) {
      throw new LayerError.INTERNAL_ERROR('The subscription does not have an invoice');
    }

    const invoice = await this.Stripe.getInvoice(subscription.latest_invoice as string);

    const orderNumber = invoice?.receipt_number?.replace('-', '');

    return orderNumber;
  }

  static async downloadReceipt(subscriptionId) {
    const receiptUrl = await this.getReceiptLink(subscriptionId);

    /**
     * Download the receipt and save it as a file into `./src/downloads/
     */
    const receiptFile = await axios.get(receiptUrl, {
      responseType: 'arraybuffer',
    });

    /**
     * 2689-5764
     * -> 26895764
     */
    const orderNumber = await this.getOrderNumber(subscriptionId);

    const receiptFileName = `careplace-receipt-${orderNumber}.pdf`;
    const receiptFilePath = `./src/downloads/${receiptFileName}`;

    fs.writeFileSync(receiptFilePath, receiptFile.data, {
      encoding: 'binary',
    });

    const receipt = {
      filename: receiptFileName,

      path: receiptFilePath,
    };

    return receipt;
  }

  static async getConnectedAccountActiveClients(accountId: string) {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); // Set the date to the first day of the month
    currentMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00

    const previousMonthStart = new Date(); // Initialize a new date object
    previousMonthStart.setDate(1); // Set the date to the first day of the month
    previousMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1); // Set the month to the previous month

    const currentMonthChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(currentMonthStart.getTime() / 1000),
      },
    });

    const previousMonthChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(previousMonthStart.getTime() / 1000),
        lt: Math.floor(currentMonthStart.getTime() / 1000),
      },
    });

    const [currentMonthCharges, previousMonthCharges] = await Promise.all([
      currentMonthChargesPromise,
      previousMonthChargesPromise,
    ]);

    const currentMonthClients = currentMonthCharges.data.length;
    const previousMonthClients = previousMonthCharges.data.length;

    let monthOverMonthPercentage = 0;

    if (previousMonthClients !== 0) {
      monthOverMonthPercentage =
        ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100;
    }

    return {
      value: Number(currentMonthClients.toFixed(2)),
      month_over_month_percentage: Number(monthOverMonthPercentage.toFixed(2)),
    };
  }

  // TODO Move this to dashboard.helper.ts
  static async getConnectedAccountCurrentMonthlyBilling(accountId: string) {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); // Set the date to the first day of the month
    currentMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00

    const previousMonthStart = new Date(); // Initialize a new date object
    previousMonthStart.setDate(1); // Set the date to the first day of the month
    previousMonthStart.setHours(0, 0, 0, 0); // Set the time to 00:00:00:00
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1); // Set the month to the previous month

    const currentMonthChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(currentMonthStart.getTime() / 1000),
      },
    });

    const previousMonthChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(previousMonthStart.getTime() / 1000),
        lt: Math.floor(currentMonthStart.getTime() / 1000),
      },
    });

    const [currentMonthCharges, previousMonthCharges] = await Promise.all([
      currentMonthChargesPromise,
      previousMonthChargesPromise,
    ]);

    let currentMonthChargesAmount = currentMonthCharges.data.reduce(
      (total, charge) => total + charge.amount,
      0
    );

    currentMonthChargesAmount /= 100; // Convert from cents to dollars

    let previousMonthChargesAmount = previousMonthCharges.data.reduce(
      (total, charge) => total + charge.amount,
      0
    );

    previousMonthChargesAmount /= 100; // Convert from cents to dollars

    let monthOverMonthPercentage = 0;

    if (previousMonthChargesAmount !== 0) {
      monthOverMonthPercentage =
        ((currentMonthChargesAmount - previousMonthChargesAmount) / previousMonthChargesAmount) *
        100;
    }

    return {
      value: Number(currentMonthChargesAmount.toFixed(2)),
      month_over_month_percentage: Number(monthOverMonthPercentage.toFixed(2)),
    };
  }

  static async getConnectedAccountYearToDateBilling(accountId: string) {
    const currentYear = new Date().getFullYear();

    const currentYearChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(new Date(currentYear, 0, 1).getTime() / 1000),
      },
    });

    const previousYearChargesPromise = this.getChargesByConnectedAccountId(accountId, {
      status: 'succeeded',
      created: {
        gte: Math.floor(new Date(currentYear - 1, 0, 1).getTime() / 1000),
        lt: Math.floor(new Date(currentYear, 0, 1).getTime() / 1000),
      },
    });

    const [currentYearCharges, previousYearCharges] = await Promise.all([
      currentYearChargesPromise,
      previousYearChargesPromise,
    ]);

    let yearToDateChargesAmount = currentYearCharges.data.reduce(
      (total, charge) => total + charge.amount,
      0
    );

    yearToDateChargesAmount /= 100; // Convert from cents to dollars

    let previousYearChargesAmount = previousYearCharges.data.reduce(
      (total, charge) => total + charge.amount,
      0
    );

    previousYearChargesAmount /= 100; // Convert from cents to dollars

    let yearOverYearPercentage = 0;

    if (previousYearChargesAmount !== 0) {
      yearOverYearPercentage =
        ((yearToDateChargesAmount - previousYearChargesAmount) / previousYearChargesAmount) * 100;
    }

    return {
      value: Number(yearToDateChargesAmount.toFixed(2)),
      year_over_year_percentage: Number(yearOverYearPercentage.toFixed(2)),
    };
  }

  // TODO Move this to dashboard.helper.ts
  static async getConnectAccountTotalRevenueByMonth(accountId: string) {
    try {
      const charges = await this.getChargesByConnectedAccountId(accountId, {
        status: 'succeeded',
      });

      const revenuePerYearAndMonth = {};

      // Calculate the range of years to consider
      let startYear = new Date().getFullYear();
      let endYear = startYear;

      // Find earliest and latest year from the charges data
      for (const charge of charges.data) {
        const date = new Date(charge.created * 1000);
        const year = date.getFullYear();
        startYear = Math.min(startYear, year);
        endYear = Math.max(endYear, year);
      }

      // Initialize all months of all years in the range with 0 revenue
      for (let year = startYear; year <= endYear; year++) {
        if (!revenuePerYearAndMonth[year]) {
          revenuePerYearAndMonth[year] = {};
        }

        for (let month = 1; month <= 12; month++) {
          if (!revenuePerYearAndMonth[year][month]) {
            // Check if the current year is the end year, if so set to null, otherwise set to 0
            revenuePerYearAndMonth[year][month] = year === endYear ? null : 0;
          }
        }
      }

      // Calculate the revenue for each month
      for (const charge of charges.data) {
        const date = new Date(charge.created * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        revenuePerYearAndMonth[year][month] += charge.amount / 100;
      }

      const revenuePerMonthArray = Object.keys(revenuePerYearAndMonth).map((year) => {
        const data = Object.keys(revenuePerYearAndMonth[year]).map((month) => ({
          month: parseInt(month),
          revenue: parseFloat(revenuePerYearAndMonth[year][month]?.toFixed(2)) || 0,
        }));

        return {
          year: parseInt(year),
          data,
        };
      });

      // get the months into an array like [120, 150, 300, 225]
      /**
        * const rawData = revenuePerMonthArray.reduce((acc, year) => {
          return acc.concat(year.data.map((month) => month.revenue).filter(Boolean));
        }, [] as number[]);

        *  */
      // ----------------- FORECAST -----------------

      /**
       * The idea is to use the billong data and with statistics calculate the forecast.
       * Because it is something complex to do in a short time we will just add 10% each month to the previous month.
       */

      // Starting on the next month add 10% to the previous month
      const nexthMonthIndex = new Date().getMonth() + 1; // 0 - 11 (January - December)

      logger.info(`nexthMonthIndex: ${nexthMonthIndex}`);
      logger.info(
        `revenuePerMonthArray ${JSON.stringify(
          revenuePerMonthArray[revenuePerMonthArray.length - 1],
          null,
          2
        )}`
      );

      logger.info(
        `revenuePerMonthArray.data ${JSON.stringify(
          revenuePerMonthArray[revenuePerMonthArray.length - 1].data,
          null,
          2
        )}`
      );
      logger.info(
        `revenuePerMonthArray.data.length ${
          revenuePerMonthArray[revenuePerMonthArray.length - 1].data.length
        }`
      );

      for (let i = nexthMonthIndex; i < 12; i++) {
        logger.info(`i: ${i}`);

        // random percentage between 1.05 and 1.15
        const percentageIncrease = Math.random() * (1.15 - 1.05) + 1.05;

        const previousMonthRevenue =
          revenuePerMonthArray[revenuePerMonthArray.length - 1].data[i - 1].revenue;

        logger.info(`previousMonthRevenue: ${previousMonthRevenue}`);
        const nextMonthRevenue = Number((previousMonthRevenue * percentageIncrease).toFixed(2));

        logger.info(`nextMonthRevenue: ${nextMonthRevenue}`);

        revenuePerMonthArray[revenuePerMonthArray.length - 1].data[i].revenue = nextMonthRevenue;
      }

      // ----------------- FORECAST -----------------

      return revenuePerMonthArray;
    } catch (error) {
      throw error;
    }
  }

  static async getInvoicesByConnectedAccountId(
    accountId: string,
    filters: Stripe.InvoiceListParams
  ) {
    const invoices = (await this.Stripe.listInvoices(filters)).data;

    const filteredInvoices = invoices.filter(
      (invoice) => invoice.transfer_data?.destination === accountId
    );

    return filteredInvoices;
  }

  static async getChargesByConnectedAccountId(accountId, filters, lastChargeId?: string) {
    const options = {
      ...filters,
      limit: 100,
    };

    if (lastChargeId) {
      options.starting_after = lastChargeId;
    }

    try {
      const charges = await this.Stripe.listCharges(options, { stripeAccount: accountId });

      // If there are more charges, fetch the next page
      if (charges.has_more) {
        const lastCharge = charges.data[charges.data.length - 1];
        const moreCharges = await this.getChargesByConnectedAccountId(
          accountId,
          filters,
          lastCharge?.id
        );
        charges.data.push(...moreCharges.data);
      }

      return charges;
    } catch (error) {
      throw error;
    }
  }

  static async listCharges(filters = {}, options = {}) {
    try {
      const charges = await this.Stripe.listCharges(filters, options);

      return charges;
    } catch (error) {
      logger.error('ERROR: ', error);

      throw error;
    }
  }

  static async getPromotionCodeByName(name: string) {
    const promotionCodes = (await this.Stripe.listPromotionCodes()).data;

    const promotionCode = promotionCodes.find((promotionCode) => promotionCode.code === name);

    return promotionCode;
  }

  static async getPaymentMethodByChargeId(chargeId: string) {
    const charge = await this.Stripe.getCharge(chargeId);

    if (!charge || !charge.payment_method) throw new LayerError.NOT_FOUND('Charge not found');

    const paymentMethod = await this.Stripe.retrievePaymentMethod(charge.payment_method);

    return paymentMethod;
  }

  static async getBillingAddressByChargeId(chargeId) {
    const paymentMethod = await this.getPaymentMethodByChargeId(chargeId);

    const billingAddress = paymentMethod.billing_details.address;

    return billingAddress;
  }
}
