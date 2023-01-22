import StripeService from "../../services/stripe.service.js";

import * as LayerError from "../../utils/errors/layer/index.js";

import axios from "axios";
import logger from "../../../../logs/logger.js";

import fs from "fs";

import { STRIPE_APPLICATION_FEE } from "../../../../config/constants/index.js";

export default class StripeHelper {
  constructor() {
    const Stripe = new StripeService();

    this.Stripe = Stripe;
  }

  async getInvoicesByConnectedAccountId(accountId, filters) {
    let invoices = await this.Stripe.listInvoices(filters);

    invoices = invoices;

    invoices = invoices.filter((invoice) => {
      return invoice.transfer_data.destination === accountId;
    });

    return invoices;
  }

  async getSubscriptionsByConnectedAcountId(accountId, filters) {
    let subscriptions = await this.Stripe.listSubscriptions(filters);

    logger.info("subscriptions", subscriptions);

    subscriptions = subscriptions;

    subscriptions = subscriptions.filter((subscription) => {
      return subscription.transfer_data.destination === accountId;
    });

    return subscriptions;
  }

  async getChargesByConnectedAccountId(accountId, filters) {
    let charges = await this.Stripe.listCharges(filters);

    charges = charges;

    // use for each to filter the charges
    charges = charges.filter((charge) => {
      return charge.transfer_data.destination === accountId;
    });

    return charges;
  }

  async getReceiptLink(subscriptionId) {
    let subscription = await this.Stripe.getSubscription(subscriptionId);

    let invoice = await this.Stripe.getInvoice(subscription.latest_invoice);

    let charge = await this.Stripe.getCharge(invoice.charge);

    let receiptUrl = charge.receipt_url.replace("?s=ap", "") + "/pdf?s=em";

    return receiptUrl;
  }

  async getOrderNumber(subscriptionId) {
    let subscription = await this.Stripe.getSubscription(subscriptionId);

    let invoice = await this.Stripe.getInvoice(subscription.latest_invoice);

    let orderNumber = invoice.receipt_number.replace("-", "");

    return orderNumber;
  }

  async getReceipt(subscriptionId) {
    let receiptUrl = await this.getReceiptLink(subscriptionId);

    /**
     * Download the receipt and save it as a file into `./src/downloads/
     */
    let receiptFile = await axios.get(receiptUrl, {
      responseType: "arraybuffer",
    });

    /**
     * 2689-5764
     * -> 26895764
     */
    let orderNumber = await this.getOrderNumber(subscriptionId);

    let receiptFileName = `careplace-receipt-${orderNumber}.pdf`;
    let receiptFilePath = `./src/downloads/${receiptFileName}`;

    fs.writeFileSync(receiptFilePath, receiptFile.data, {
      encoding: "binary",
    });

    let receipt = {
      filename: receiptFileName,

      path: receiptFilePath,
    };

    return receipt;
  }

  async getConnectedAccountActiveClients(accountId) {
    let clients = await this.getSubscriptionsByConnectedAcountId(accountId, {
      status: "active",
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
     * To search dates in Stripe we need to convert them to unix timestamps.
     */
    let firstDayOfPreviousMonthTimestamp = Math.floor(
      firstDayOfPreviousMonth.getTime() / 1000
    );

    let lastDayOfPreviousMonthTimestamp = Math.floor(
      lastDayOfPreviousMonth.getTime() / 1000
    );

    let previousMonthInvoices = await this.getInvoicesByConnectedAccountId(
      accountId,
      {
        status: "paid",
        created: {
          gt: firstDayOfPreviousMonthTimestamp,
          lt: lastDayOfPreviousMonthTimestamp,
        },
      }
    );

    let previousMonthSubscriptions = [];

    previousMonthInvoices.forEach((invoice) => {
      previousMonthSubscriptions.push(invoice.subscription);
    });

    let activeClientsDifferencePercentage = 0.0;

    // The percent should have 1 decimals. (e.g. 10.1%). If the difference is 0, the percent should be 0.0%.

    if (previousMonthSubscriptions.length !== 0) {
      activeClientsDifferencePercentage = (
        ((clients.length - previousMonthSubscriptions.length) /
          previousMonthSubscriptions.length) *
        100
      ).toFixed(1);
    }

    let response = {
      data: clients.length,
      active_clients_difference_percentage: 0,
    };

    return response;
  }

  async getConnectedAccountCurrentMRR(accountId) {
    let subscriptions = await this.getSubscriptionsByConnectedAcountId(
      accountId,
      {
        status: "active",
      }
    );

    let currentMRR = 0;

    subscriptions.forEach((subscription) => {
      currentMRR += subscription.plan.amount;
    });

    /**
     * Get the MRR from the previous month to compare it with the current MRR and return the difference (in %).
     * This should be done be getting the invoices from the previous month. We expand the charge object so that we only account for payed invoices.
     * The invoices from the previous month are all the invoices from the first day to the last day of the previous month.
     */
    let date = new Date();

    let year = date.getFullYear();

    let month = date.getMonth();

    let firstDayOfPreviousMonth = new Date(year, month - 1, 1);

    let lastDayOfPreviousMonth = new Date(year, month, 0);

    /**
     * To search dates in Stripe we need to convert them to unix timestamps.
     */
    let firstDayOfPreviousMonthTimestamp = Math.floor(
      firstDayOfPreviousMonth.getTime() / 1000
    );

    let lastDayOfPreviousMonthTimestamp = Math.floor(
      lastDayOfPreviousMonth.getTime() / 1000
    );

    let previousMonthInvoices = await this.getInvoicesByConnectedAccountId(
      accountId,
      {
        status: "paid",
        created: {
          gt: firstDayOfPreviousMonthTimestamp,
          lt: lastDayOfPreviousMonthTimestamp,
        },
      }
    );

    let previousMonthMRR = 0;

    previousMonthInvoices.forEach((invoice) => {
      if (invoice.charge.status === "succeeded") {
        previousMonthMRR += invoice.charge.amount;
      }
    });

    let mrrDifferencePercentage = 0.0;

    // The percent should have 1 decimals. (e.g. 10.1%). If the difference is 0, the percent should be 0.0%.
    if (previousMonthMRR !== 0) {
      mrrDifferencePercentage = (
        ((currentMRR - previousMonthMRR) / previousMonthMRR) *
        100
      ).toFixed(1);
    }

    let response = {
      data: currentMRR,
      mrr_difference_percentage: mrrDifferencePercentage,
    };

    return response;
  }

  /**
   * Function that for each year gets the total revenue for each month of the year. If there is more than one year, it will return an array of objects, each object containing the year and the data for that year.
   * The revenue for each month is calculated by summing up the amount of each charge for each invoice (and using the 'created' field from the charge). The 'created' field is in the following format: 1673399302 (1673399302 -> 2023-03-21). From the 'created' field the year should also be taken into account to group the data by year (to then return it as the example).
   * When returning the data each month is represented by a number from 1 to 12.
   * The data should be used to create a chart.
   * The output should follow the following format:
   * 
   *   [
  {
    year: 2023,
    data: [
      {
        month: 1,
        revenue: 1000,
      },
    ],
  },
  {
    year: 2022,
    data: [
      {
        month: 10,
        revenue: 1000,
      },
      {
        month: 11,
        revenue: 900,
      },

      {
        month: 12,
        revenue: 1200,
      },
    ],
  },
]
   * 
   */
  async getConnectAccountTotalRevenueByMonth(accountId) {
    let charges = await this.getChargesByConnectedAccountId(accountId);

    let data = [];

    charges.forEach((charge) => {
      let date = new Date(charge.created * 1000);

      let year = date.getFullYear();

      let month = date.getMonth() + 1;

      let revenue = charge.amount;

      let yearIndex = data.findIndex((item) => item.year === year);

      if (yearIndex === -1) {
        data.push({
          year: year,
          data: [
            {
              month: month,
              revenue: revenue,
            },
          ],
        });
      } else {
        let monthIndex = data[yearIndex].data.findIndex(
          (item) => item.month === month
        );

        if (monthIndex === -1) {
          data[yearIndex].data.push({
            month: month,
            revenue: revenue,
          });
        } else {
          data[yearIndex].data[monthIndex].revenue += revenue;
        }
      }
    });

    return data;
  }

  async getPromotionCodeByName(name) {
    let promotionCodes = await this.Stripe.listPromotionCodes();

    let promotionCode = promotionCodes.find(
      (promotionCode) => promotionCode.code === name
    );

    return promotionCode;
  }

  /**
   * Only works with Coupons that have a fixed amount discount. It doesn't work with Coupons that have a percentage discount.
   */
  async calculateApplicationFeeWithPromotionCode(amount, promotionCodeId) {
    let promotionCode = await this.Stripe.getPromotionCode(promotionCodeId, {
      expand: ["restrictions", "coupon"],
    });

    let coupon = promotionCode.coupon;

    let applicationAmmount =
      amount * (STRIPE_APPLICATION_FEE / 100) - coupon.amount_off / 100;

    /**
     * A non-negative decimal between 0 and 100, with at most two decimal places. This represents the percentage of the subscription invoice subtotal that will be transferred to the application owner’s Stripe account.
     *
     * @see https://stripe.com/docs/api/subscriptions/object#subscription_object-application_fee_percent
     */
    let newApplicationFee = (
      (applicationAmmount * 100) /
      (amount - coupon.amount_off / 100)
    ).toFixed(2);

    logger.info(`Cupao: ${JSON.stringify(coupon, null, 2)}`);

    if (newApplicationFee > 100 || newApplicationFee < 0) {
      throw new LayerError.INVALID_PARAMETER(
        `Unable to apply promotion code to this order. Minimum order value is: ${promotionCode.restrictions.minimum_amount / 100}€`
      );
    }

    return newApplicationFee;
  }
}
