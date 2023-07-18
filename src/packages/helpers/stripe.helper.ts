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

  static async getSubscriptionsByConnectedAcountId(accountId: string, filters) {
    let subscriptions = (await this.Stripe.listSubscriptions(filters)).data;

    subscriptions = subscriptions.filter((subscription) => {
      return subscription?.transfer_data?.destination === accountId;
    });

    return subscriptions;
  }

  static async getReceiptLink(subscriptionId) {
    let subscription = await this.Stripe.getSubscription(subscriptionId);

    if (!subscription.latest_invoice) {
      throw new LayerError.INTERNAL_ERROR('The subscription does not have an invoice');
    }

    let invoice = await this.Stripe.getInvoice(subscription.latest_invoice as string);

    if (!invoice.charge) {
      throw new LayerError.INTERNAL_ERROR('The invoice does not have a charge');
    }

    let charge = await this.Stripe.getCharge(invoice.charge as string);

    let receiptUrl = charge?.receipt_url?.replace('?s=ap', '') + '/pdf?s=em';

    return receiptUrl;
  }

  static async getOrderNumber(subscriptionId) {
    let subscription = await this.Stripe.getSubscription(subscriptionId);

    if (!subscription.latest_invoice) {
      throw new LayerError.INTERNAL_ERROR('The subscription does not have an invoice');
    }

    let invoice = await this.Stripe.getInvoice(subscription.latest_invoice as string);

    let orderNumber = invoice?.receipt_number?.replace('-', '');

    return orderNumber;
  }

  static async getReceipt(subscriptionId) {
    let receiptUrl = await this.getReceiptLink(subscriptionId);

    /**
     * Download the receipt and save it as a file into `./src/downloads/
     */
    let receiptFile = await axios.get(receiptUrl, {
      responseType: 'arraybuffer',
    });

    /**
     * 2689-5764
     * -> 26895764
     */
    let orderNumber = await this.getOrderNumber(subscriptionId);

    let receiptFileName = `careplace-receipt-${orderNumber}.pdf`;
    let receiptFilePath = `./src/downloads/${receiptFileName}`;

    fs.writeFileSync(receiptFilePath, receiptFile.data, {
      encoding: 'binary',
    });

    let receipt = {
      filename: receiptFileName,

      path: receiptFilePath,
    };

    return receipt;
  }

  static async getConnectedAccountActiveClients(accountId: string) {
    let clients = await this.getSubscriptionsByConnectedAcountId(accountId, {
      status: 'active',
    });
    /**
     * Get the subscriptions from the previous month to compare it with the current subscriptions and return the difference (in %).
     * This should be done by getting the invoices from the previous month. This are all the invoices that have a status = "payed" and that the period_start is in the previous month.
     * The previous month is the month before the current month and starts on the first day of the previous month and ends on the last day of the previous month.
     */

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    let firstDayOfPreviousMonth = new Date(year, month - 1, 1);
    let lastDayOfPreviousMonth = new Date(year, month, 0);

    /**
     * To search dates in Stripe we need to convert them to Unix timestamps.
     */
    let firstDayOfPreviousMonthTimestamp = Math.floor(firstDayOfPreviousMonth.getTime() / 1000);
    let lastDayOfPreviousMonthTimestamp = Math.floor(lastDayOfPreviousMonth.getTime() / 1000);

    let previousMonthInvoices = await this.getInvoicesByConnectedAccountId(accountId, {
      status: 'paid',
      created: {
        gt: firstDayOfPreviousMonthTimestamp,
        lt: lastDayOfPreviousMonthTimestamp,
      },
    });

    let previousMonthSubscriptions: string[] = [];

    previousMonthInvoices.forEach((invoice: any) => {
      previousMonthSubscriptions.push(invoice.subscription);
    });

    let activeClientsDifferencePercentage = '0.0';

    // The percent should have 1 decimal place (e.g., 10.1%). If the difference is 0, the percent should be '0.0'.

    if (previousMonthSubscriptions.length !== 0) {
      activeClientsDifferencePercentage = (
        ((clients.length - previousMonthSubscriptions.length) / previousMonthSubscriptions.length) *
        100
      ).toFixed(1);
    }

    let response = {
      data: clients.length,
      active_clients_difference_percentage: activeClientsDifferencePercentage,
    };

    return response;
  }

  static async getConnectedAccountCurrentMRR(accountId: string) {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const filters = {
      status: 'active',
      current_period_start: {
        gte: Math.floor(currentMonthStart.getTime() / 1000),
      },
    };

    const subscriptions = await this.getSubscriptionsByConnectedAcountId(accountId, filters);

    const currentMRR = subscriptions.reduce((totalMRR, subscription) => {
      const subscriptionItem = subscription.items.data[0]; // Assuming there is only one subscription item

      if (
        !subscriptionItem.price ||
        subscriptionItem.price.unit_amount === null ||
        subscriptionItem.quantity === undefined
      ) {
        return totalMRR;
      }

      const unitAmount = subscriptionItem.price.unit_amount;
      const quantity = subscriptionItem.quantity;
      const subscriptionMRR = unitAmount * quantity;

      return totalMRR + subscriptionMRR;
    }, 0);

    return currentMRR;
  }

  static async getInvoicesByConnectedAccountId(
    accountId: string,
    filters: Stripe.InvoiceListParams
  ) {
    const invoices = (await this.Stripe.listInvoices(filters)).data;

    const filteredInvoices = invoices.filter((invoice) => {
      return invoice.transfer_data?.destination === accountId;
    });

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
      let charges = await this.Stripe.listCharges(options, { stripeAccount: accountId });

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

  static async getConnectAccountTotalRevenueByMonth(accountId: string) {
    try {
      let charges = await this.getChargesByConnectedAccountId(accountId, {
        status: 'succeeded',
      });

      const revenuePerYearAndMonth = {};

      // Calculate the range of years to consider
      let startYear = new Date().getFullYear();
      let endYear = startYear;

      // Find earliest and latest year from the charges data
      for (let charge of charges.data) {
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
      for (let charge of charges.data) {
        const date = new Date(charge.created * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        revenuePerYearAndMonth[year][month] += charge.amount / 100;
      }

      const revenuePerMonthArray = Object.keys(revenuePerYearAndMonth).map((year) => {
        const data = Object.keys(revenuePerYearAndMonth[year]).map((month) => {
          return {
            month: parseInt(month),
            revenue: parseFloat(revenuePerYearAndMonth[year][month]?.toFixed(2)),
          };
        });

        return {
          year: parseInt(year),
          data,
        };
      });

      // get the months into an array like [120, 150, 300, 225]
      const rawData = revenuePerMonthArray.reduce((acc, year) => {
        return acc.concat(year.data.map((month) => month.revenue).filter(Boolean));
      }, [] as number[]);

      // remove the first month ever because it's not a full month
      rawData.shift();

      // ----------------- FORECAST -----------------

      let forecast = {
        year: revenuePerMonthArray[revenuePerMonthArray.length - 1].year,
        type: 'forecast',
        data: [] as { month: number; revenue: number }[],
      };

      const forecastEntries = revenuePerMonthArray[revenuePerMonthArray.length - 1].data.filter(
        (month) => month.revenue === null || isNaN(month.revenue)
      ).length;
      /**
       * Linear regression
       */
      if (rawData.length >= 3) {
        // transform the rawData into an array like [ [1, 1], [2, 2], [3, 4], [4, 3] ]
        const regressionData = rawData.map((value, index) => [index + 1, value]);

        const equation = regression.linear(regressionData);

        const slope = equation.equation[0];
        const intercept = equation.equation[1];

        // for the months that the last year has data in the forecast use null
        for (let i = 0; i < 12 - forecastEntries; i++) {
          forecast.data.push({
            month: revenuePerMonthArray[revenuePerMonthArray.length - 1].data[i].month,
            revenue: NaN,
          });
        }

        // use the equation to calculate the forecast
        for (let i = 0; i <= forecastEntries; i++) {
          // add to the forecast.data array in the format { month: 1, revenue: 100 }
          forecast.data.push({
            month:
              revenuePerMonthArray[revenuePerMonthArray.length - 1].data.length -
              forecastEntries +
              i,
            revenue:
              // if the current forecast revenue is negative, set it to 0
              parseFloat(
                (
                  (slope / 2.7) *
                    (revenuePerMonthArray[revenuePerMonthArray.length - 1].data.length + i) +
                  intercept
                ).toFixed(2)
              ) < 0
                ? 0
                : parseFloat(
                    (
                      (slope / 2.7) *
                        (revenuePerMonthArray[revenuePerMonthArray.length - 1].data.length + i) +
                      intercept
                    ).toFixed(2)
                  ),
          });
        }

        // carry the last revenue month as the first month of the forecast
        forecast.data.find((entry) => entry.month === 12 - forecastEntries)!.revenue =
          revenuePerMonthArray[revenuePerMonthArray.length - 1].data.find(
            (entry) => entry.month === 12 - forecastEntries
          )!.revenue;
      }

      // Carry the last revenue month as all the months of the forecast
      else {
        forecast.data = revenuePerMonthArray[revenuePerMonthArray.length - 1].data.map((entry) => {
          return {
            month: entry.month,
            revenue: entry.revenue,
          };
        });
      }

      // add the forecast to the revenuePerMonthArray
      revenuePerMonthArray.push(forecast);

      // ----------------- FORECAST -----------------

      return revenuePerMonthArray;
    } catch (error) {
      throw error;
    }
  }

  static async getPromotionCodeByName(name: string) {
    let promotionCodes = (await this.Stripe.listPromotionCodes()).data;

    let promotionCode = promotionCodes.find((promotionCode) => promotionCode.code === name);

    return promotionCode;
  }

  /**
   * Only works with Coupons that have a fixed amount discount. It doesn't work with Coupons that have a percentage discount.
   */
  static async calculateApplicationFeeWithPromotionCode(
    amount: number,
    promotionCodeId: string
  ): Promise<number> {
    let promotionCode = await this.Stripe.getPromotionCode(promotionCodeId, {
      expand: ['restrictions', 'coupon'],
    });

    let coupon: Stripe.Coupon = promotionCode.coupon;
    let couponAmountOff =
      coupon.amount_off !== null ? parseFloat(coupon.amount_off.toString()) / 100 : 0;

    let applicationAmount = amount * (parseFloat(STRIPE_APPLICATION_FEE) / 100) - couponAmountOff;

    /**
     * A non-negative decimal between 0 and 100, with at most two decimal places. This represents the percentage of the subscription invoice subtotal that will be transferred to the application owner’s Stripe account.
     *
     * @see https://stripe.com/docs/api/subscriptions/object#subscription_object-application_fee_percent
     */
    let newApplicationFee = ((applicationAmount * 100) / (amount - couponAmountOff / 100)).toFixed(
      2
    );

    if (
      parseFloat(newApplicationFee) > 100 ||
      parseFloat(newApplicationFee) < 0 ||
      promotionCode.restrictions.minimum_amount === null
    ) {
      throw new LayerError.INVALID_PARAMETER(
        `Unable to apply promotion code to this order. Minimum order value is: ${
          promotionCode.restrictions.minimum_amount !== null
            ? promotionCode.restrictions.minimum_amount / 100
            : 0
        }€`
      );
    }

    return parseFloat(newApplicationFee);
  }

  static async getPaymentMethodByChargeId(chargeId: string) {
    let charge = await this.Stripe.getCharge(chargeId);

    if (!charge || !charge.payment_method) throw new LayerError.NOT_FOUND('Charge not found');

    let paymentMethod = await this.Stripe.retrievePaymentMethod(charge.payment_method);

    return paymentMethod;
  }

  static async getBillingAddressByChargeId(chargeId) {
    let paymentMethod = await this.getPaymentMethodByChargeId(chargeId);

    let billingAddress = paymentMethod.billing_details.address;

    return billingAddress;
  }
}
