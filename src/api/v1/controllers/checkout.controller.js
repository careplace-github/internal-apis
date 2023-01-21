// Import Stripe Service
import StripeService from "../services/stripe.service.js";

import {
  STRIPE_PRODUCT_ID,
  STRIPE_APPLICATION_FEE,
  AWS_SES_ORDERS_BCC_EMAIL,
} from "../../../config/constants/index.js";

import ordersDAO from "../db/orders.dao.js";

// Import logger
import logger from "../../../logs/logger.js";

import CRUD from "./crud.controller.js";

import SesService from "../services/ses.service.js";
import emailHelper from "../helpers/emails/email.helper.js";
import stripeHelper from "../helpers/services/stripe.helper.js";
import dateUtils from "../utils/data/date.utils.js";

import * as Error from "../utils/errors/http/index.js";

/**
 * Create a new instance of the OrdersDAO.
 */

/**
 * Create a new instance of the CRUD class.
 * This class has the basic CRUD operations/methods.
 */

/**
 * Create a new instance of the AuthHelper class.
 */
/*
 * @class CheckoutController
 */
export default class CheckoutController {
  static async createPaymentIntent(req, res, next) {
    try {
      /**
       * Get the order id from the request params.
       * Retrieve the order from the database.
       *
       *
       */

      let response = {};

      let orderId = req.params.id;

      let token = req.body.token;

      if (!token) {
        throw new Error._400("Missing required payment method token");
      }

      let billingAddress = req.body.billing_address;
      if (
        !billingAddress || // Check if billingAddress is null or undefined
        !billingAddress.street ||
        !billingAddress.city ||
        !billingAddress.country ||
        !billingAddress.postal_code ||
        !billingAddress.name ||
        !billingAddress.email
      ) {
        throw new Error._400("Missing billing address fields");
      }

      // Convert orderId to string
      orderId = orderId.toString();

      const OrdersDAO = new ordersDAO();
      const OrdersCRUD = new CRUD(OrdersDAO);
      let order = await OrdersDAO.query_one(
        { _id: { $eq: orderId } },

        [
          {
            path: "company",
            model: "Company",
          },
          {
            path: "customer",
            model: "marketplace_users",
          },
        ]
      );

      let Stripe = new StripeService();

      // Convert token to string
      token = token.toString();

      let accountId = order.company.stripe_information.account_id;
      let customerId = order.customer.stripe_information.customer_id;
      // Convert amount to interger
      let amount = parseInt(order.order_total) * 100;

      let stripeCustomer = await Stripe.getCustomer(customerId);
      let currency = stripeCustomer.currency;
      let productId = STRIPE_PRODUCT_ID;
      let priceId;

      /**
       * Check if any field is missing in req.body.billing_address
       */

      /**
       * Create a payment method for the customer.
       * @todo Check PM type through the token
       */
      let paymentMethod = await Stripe.createPaymentMethodWithToken(
        "card",
        token,
        billingAddress
      );

      console.log(
        `Payment Method ID: ${JSON.stringify(paymentMethod, null, 2)}`
      );

      let paymentMethodId = paymentMethod.id;

      /**
       * Attach the paymentMethod to the customer.
       */
      await Stripe.attachPaymentMethodToCustomer(paymentMethodId, customerId);

      /**
       * Create a price for the product.
       */
      try {
        priceId = await Stripe.createPrice(
          productId,
          amount,
          currency,
          "month"
        );
        priceId = priceId.id;
      } catch (err) {
        console.log(`Error: ${JSON.stringify(err, null, 2)}`);
      }

      let subscription = await Stripe.createSubscription(
        customerId,
        priceId,
        accountId,
        STRIPE_APPLICATION_FEE,
        paymentMethodId
      );

      /**
       * Update the order with the subscription id.
       */
      order.subscription_id = subscription.id;

      response.statusCode = 200;
      response.data = {
        order: order,
        subscription: subscription,
      };

      next(response);

      let StripeHelper = new stripeHelper(Stripe);

      let receipt = await StripeHelper.getReceipt(subscription.id);

      let EmailHelper = new emailHelper();

      let DateUtils = new dateUtils();

      let schedule = await DateUtils.getScheduleRecurrencyText(
        order.schedule_information.schedule
      );

      /**
       * Remove last 4 digits from order number
       *
       * @example
       * A53F4B19-0038
       * -> A53F4B19
       */
      let orderNumber = await StripeHelper.getOrderNumber(subscription.id);

      let receiptDate = await DateUtils.getDateFromUnixTimestamp(
        subscription.latest_invoice.created
      );

      let receiptLink = await StripeHelper.getReceiptLink(subscription.id);

      console.log(`Receipt Link: ${receiptLink}`);

      let startDate = await DateUtils.convertDateToReadableString(
        order.actual_start_date
      );

      let emailPayload = {
        name: paymentMethod.billing_details.name,
        startDate: startDate,
        schedule: schedule,
        subTotal: (
          (parseInt(subscription.plan.amount) / 100) *
          0.77
        ).toString(), // Portuguese VAT (IVA) = 23% -> 100-23 = 77%
        taxAmmount: (
          (parseInt(subscription.plan.amount) / 100) *
          0.23
        ).toString(),
        orderTotal: (parseInt(subscription.plan.amount) / 100).toString(),
        clientEmail: paymentMethod.billing_details.email,

        orderNumber: orderNumber,
        receiptDate: receiptDate,
        receiptLink: receiptLink,
        // if null, then it's a bank transfer
        // how to I caps lock a string?
        // https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript
        paymentMethod:
          paymentMethod.card.brand !== null
            ? paymentMethod.card.brand.toUpperCase()
            : "SEPA Direct Debit",
        street: paymentMethod.billing_details.address.line1,
        postalCode: paymentMethod.billing_details.address.postal_code,
        city: paymentMethod.billing_details.address.city,
        country: paymentMethod.billing_details.address.country,
      };

      let email = await EmailHelper.getEmailTemplateWithData(
        `order_payment_confirmation`,
        emailPayload
      );

      await EmailHelper.sendEmailWithAttachment(
        paymentMethod.billing_details.email,
        email.subject,
        email.htmlBody,
        null,
        [receipt],
        null,
        "orders@staging.careplace.pt"
      );

      //let email = await emailHelper.generateOrderConfirmationEmail(order);

      //  await SES.sendEmail(["henrique.efonseca@gmail.com"], "Careplace: Pagamento Confirmado", email)

      await OrdersDAO.update(order);
    } catch (err) {
      console.log(err);
      // logger.error(err);
      next(err);
    }
  }

  static async confirmPayment(req, res, next) {}
}
