// Import services
import CognitoService from "../services/cognito.service.js";
import SES from "../services/ses.service.js";

// Import DAOs
import crmUsersDAO from "../db/crmUsers.dao.js";
import MarketplaceUsersDAO from "../db/marketplaceUsers.dao.js";
import companiesDAO from "../db/companies.dao.js";
import ordersDAO from "../db/orders.dao.js";

import authUtils from "../utils/auth/auth.utils.js";
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from "../../../config/constants/index.js";

// Import Utils
import StripeService from "../services/stripe.service.js";
import authHelper from "../helpers/auth/auth.helper.js";
import stripeHelper from "../helpers/services/stripe.helper.js";
import emailHelper from "../helpers/emails/email.helper.js";
import dateUtils from "../utils/data/date.utils.js";

import {
  STRIPE_APPLICATION_FEE,
  STRIPE_PRODUCT_ID,
} from "../../../config/constants/index.js";

// Import logger
import logger from "../../../logs/logger.js";

import * as Error from "../utils/errors/http/index.js";

export default class StripeController {
  static async createPaymentMethod(req, res, next) {
    try {
      let accessToken;

      let paymentMethodToken = req.body.payment_method_token;

      let billingAddress = req.body.billing_address;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let Stripe = new StripeService();

      let createPaymentMethod = await Stripe.createPaymentMethodWithToken(
        "card",
        paymentMethodToken,
        billingAddress
      );

      let paymentMethodAttached = await Stripe.attachPaymentMethodToCustomer(
        createPaymentMethod.id,
        customerId
      );

      let response = {
        statusCode: 200,
        data: paymentMethodAttached,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async retrievePaymentMethod(req, res, next) {
    try {
      let paymentMethodId = req.params.id;

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let Stripe = new StripeService();

      let paymentMethod = await Stripe.getPaymentMethod(paymentMethodId);

      let response = {
        statusCode: 200,
        data: paymentMethod,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async deletePaymentMethod(req, res, next) {
    try {
      let accessToken;

      let paymentMethodId = req.params.id;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let Stripe = new StripeService();

      // Check if the payment method is attached to the customer trying to delete it.
      let paymentMethod = await Stripe.getPaymentMethod(paymentMethodId);

      if (paymentMethod.customer !== customerId) {
        throw new Error._403(
          "You are not authorized to delete this payment method."
        );
      }
      let paymentMethodDeleted = await Stripe.deletePaymentMethod(
        paymentMethodId,
        customerId
      );

      let response = {
        statusCode: 200,
        data: paymentMethodDeleted,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async listPaymentMethods(req, res, next) {
    try {
      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let Stripe = new StripeService();

      let paymentMethods = await Stripe.listPaymentMethods(customerId);

      let response = {
        statusCode: 200,
        data: paymentMethods,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async createExternalAccount(req, res, next) {
    try {
      let accessToken;

      let externalAccountToken = req.body.external_account_token;

      let billingAddress = req.body.billing_address;

      let CompaniesDAO = new companiesDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find(
        (obj) => obj.Name === "custom:company"
      ).Value;

      let company = await CompaniesDAO.query_one({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      logger.info(`ACCOUNT ID: ${accountId}`);

      let createExternalAccount = await Stripe.createExternalAccount(
        accountId,
        externalAccountToken
      );

      let response = {
        statusCode: 200,
        data: createExternalAccount,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async retrieveExternalAccount(req, res, next) {
    try {
      let accessToken;

      let externalAccountId = req.params.id;

      let CompaniesDAO = new companiesDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find(
        (obj) => obj.Name === "custom:company"
      ).Value;

      let company = await CompaniesDAO.query_one({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccount = await Stripe.getExternalAccount(
        accountId,
        externalAccountId
      );

      let response = {
        statusCode: 200,
        data: externalAccount,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async deleteExternalAccount(req, res, next) {
    try {
      let accessToken;

      let externalAccountId = req.params.id;

      let CompaniesDAO = new companiesDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find(
        (obj) => obj.Name === "custom:company"
      ).Value;

      let company = await CompaniesDAO.query_one({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccount = await Stripe.getExternalAccount(
        accountId,
        externalAccountId
      );

      if (externalAccount.account !== accountId) {
        throw new Error._403(
          "You are not authorized to delete this external account."
        );
      }

      let externalAccountDeleted = await Stripe.deleteExternalAccount(
        accountId,
        externalAccountId
      );

      let response = {
        statusCode: 200,
        data: externalAccountDeleted,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async listExternalAccounts(req, res, next) {
    try {
      let accessToken;

      let CompaniesDAO = new companiesDAO();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find(
        (obj) => obj.Name === "custom:company"
      ).Value;

      let company = await CompaniesDAO.query_one({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccounts = await Stripe.listExternalAccounts(accountId);

      let response = {
        statusCode: 200,
        data: externalAccounts,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Uses Stripe service to create a subscription with a payment intent for the order.customer (as a customer) and the order.company (as a connected account).
   * Send an email to the order.customer with the payment intent client secret.
   *
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async sendQuote(req, res, next) {}

  static async createSubscriptionPaymentIntent(req, res, next) {
    try {
      let response = {};

      let orderId = req.params.id;

      let token = req.body.token;

      let promotionCode = req.body.promotion_code;

      let taxId = req.body.tax_id;

      let Stripe = new StripeService();
      let StripeHelper = new stripeHelper(Stripe);

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

      let order = await OrdersDAO.query_one(
        { _id: { $eq: orderId } },

        [
          {
            path: "company",
            model: "Company",
          },
          {
            path: "user",
            model: "marketplace_users",
          },
        ]
      );

      // Convert order to JSON
      //order = order.toJSON();

      // Convert token to string
      token = token.toString();

      let accountId = order.company.stripe_information.account_id;
      let customerId = order.user.stripe_information.customer_id;
      // Convert amount to interger
      let amount = parseFloat(order.order_total) * 100;

      let stripeCustomer = await Stripe.getCustomer(customerId);
      let currency = stripeCustomer.currency;
      let productId = STRIPE_PRODUCT_ID;
      let priceId;
      let coupon;

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

      let paymentMethodId = paymentMethod.id;

      /**
       * Attach the paymentMethod to the customer.
       */
      await Stripe.attachPaymentMethodToCustomer(paymentMethodId, customerId);

      if (taxId !== undefined && taxId !== null && taxId !== "") {
        // Check if the customer already has the tax id
        let customerTaxIds = await Stripe.getCustomerTaxIds(customerId);

        let taxIdExists = false;

        let taxIdAux = "PT" + taxId;

        for (let i = 0; i < customerTaxIds.data.length; i++) {
          if (customerTaxIds.data[i].value === taxIdAux) {
            taxIdExists = true;
            break;
          }
        }

        if (taxIdExists === false) {
          // Create a tax id for the customer
          await Stripe.createCustomerTaxId(customerId, taxId);
        }
      }

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

      let subscription;
      let stripePromotionCode;
      let newApplicationFee;

      if (
        promotionCode !== undefined &&
        promotionCode !== null &&
        promotionCode !== ""
      ) {
        stripePromotionCode = await StripeHelper.getPromotionCodeByName(
          promotionCode
        );

        coupon = stripePromotionCode.coupon;

        try {
          newApplicationFee =
            await StripeHelper.calculateApplicationFeeWithPromotionCode(
              order.order_total,
              stripePromotionCode.id
            );
        } catch (err) {
          switch (err.type) {
            case "INVALID_PARAMETER":
              throw new Error._400(err.message);

            default:
              throw new Error._500(err.message);
          }
        }

        try {
          subscription = await Stripe.createSubscription(
            customerId,
            priceId,
            accountId,
            newApplicationFee,
            paymentMethodId,
            stripePromotionCode.id
          );
        } catch (err) {
          switch (err.type) {
            default:
              throw new Error._500(err.message);
          }
        }
      } else {
        try {
          subscription = await Stripe.createSubscription(
            customerId,
            priceId,
            accountId,
            STRIPE_APPLICATION_FEE,
            paymentMethodId
          );
        } catch (err) {
          switch (err.type) {
            default:
              throw new Error._500(err.message);
          }
        }
      }

      /**
       * Update the order with the subscription id.
       */
      order.stripe_subscription_id = subscription.id;

      response.statusCode = 200;
      response.data = {
        order: order,
        subscription: subscription,
      };

      next(response);

      /**
       * After the coupon is applied, update the subscription with the normal application fee so that the next payment is charged with the normal application fee.
       */
      await Stripe.updateSubscription(subscription.id, {
        application_fee_percent: STRIPE_APPLICATION_FEE,
        proration_behavior: "none", // Do not prorate the subscription. Charge the customer the full amount for the new plan.
      });

      /**
       * Attach the stripe subscription id to the order.
       */
      await OrdersDAO.update(order);
    } catch (err) {
      console.log(err);

      next(err);
    }
  }

  static async listCoupons(req, res, next) {
    let response = new Response();
    try {
      let Stripe = new StripeService();

      let coupons = await Stripe.listCoupons();

      response.statusCode = 200;
      response.data = coupons;
      next(response);
    } catch (err) {
      next(err);
    }
  }
}
