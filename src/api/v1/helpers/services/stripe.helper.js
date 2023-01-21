import StripeService from "../../services/stripe.service.js";

import LayerError from "../../utils/errors/layer/layerError.js";

import axios from "axios";

import fs from "fs";

export default class StripeHelper {
  constructor() {
    const Stripe = new StripeService();

    this.Stripe = Stripe;
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

  async getConnectedAccountActiveSubscriptions(accountId) {
    let subscriptions = await this.Stripe.getSubscriptionsByConnectedAcountId(
      accountId,
      {
        status: "active",
      }
    );

    return subscriptions;
  }

  async getConnectedAccountCurrentMRR(accountId) {
    let subscriptions = await this.getConnectedAccountActiveSubscriptions(
      accountId
    );

    let currentMRR = 0;

    subscriptions.forEach((subscription) => {
      currentMRR += subscription.plan.amount;
    });

    return currentMRR;
  }

  /**
   *
   * Output:
   *
   * [
   * {Month: 1, totalRevenue: 1000},
   * {Month: 2, totalRevenue: 2000},
   * [...]
   * ]
   *
   * It should not have the same month twice
   * Each month should correspond to a calendar month (1 = January, 2 = February, etc.)
   * This should be done by getting the invoices (that were paid) and summing up the total amount of each invoice by month
   *
   *
   *
   */

  async getConnectAccountTotalRevenueByMonth(accountId) {
    let invoices = await this.Stripe.getInvoicesByConnectedAccountId(
      accountId,
      {
        status: "paid",
      }
    );

    let totalRevenueByMonth = [];

    invoices.forEach((invoice) => {
      let month = new Date(invoice.created * 1000).getMonth() + 1;

      let totalRevenue = invoice.amount_paid;

      let monthExists = totalRevenueByMonth.find(
        (totalRevenueByMonth) => totalRevenueByMonth.Month === month
      );

      if (monthExists) {
        monthExists.totalRevenue += totalRevenue;

        return;
      }

      totalRevenueByMonth.push({
        Month: month,
        totalRevenue: totalRevenue,
      });
    });
  }
}
