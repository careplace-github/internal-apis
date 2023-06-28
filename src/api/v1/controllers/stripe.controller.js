// Import services
import CognitoService from '../services/cognito.service';
import SES from '../services/ses.service';

// Import DAOs
import crmUsersDAO from '../db/crmUsers.dao';
import MarketplaceUsersDAO from '../db/marketplaceUsers.dao';
import companiesDAO from '../db/companies.dao';
import ordersDAO from '../db/orders.dao';

import authUtils from '../utils/auth/auth.utils';
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../config/constants/index';

// Import Utils
import StripeService from '../services/stripe.service';
import authHelper from '../helpers/auth/auth.helper';
import stripeHelper from '../helpers/services/stripe.helper';
import emailHelper from '../helpers/emails/email.helper';
import dateUtils from '../utils/data/date.utils';

import { STRIPE_APPLICATION_FEE, STRIPE_PRODUCT_ID } from '../../../config/constants/index';

// Import logger
import logger from '../../../logs/logger';

import { HTTPError } from '@api/v1/utils/errors/http';

export default class StripeController {
  static async createPaymentMethod(req, res, next) {
    try {
      let accessToken;

      let paymentMethodToken = req.body.payment_method_token;

      let billingAddress = req.body.billing_address;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let Stripe = new StripeService();

      let createPaymentMethod = await Stripe.createPaymentMethodWithToken(
        'card',
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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let Stripe = new StripeService();

      // Check if the payment method is attached to the customer trying to delete it.
      let paymentMethod = await Stripe.getPaymentMethod(paymentMethodId);

      if (paymentMethod.customer !== customerId) {
        logger.info('paymentMethod.customer: ' + paymentMethod.customer);
        logger.info('customerId: ' + customerId);
        return next(new HTTPError._403('You are not authorized to delete this payment method.'));
      }

      let OrdersDAO = new ordersDAO();

      let filters = {
        user: user._id,
        // status should be active or pending_payment
        status: ['active', 'pending_payment'],
      };

      let orders = (
        await OrdersDAO.queryList({
          filters,
        })
      ).data;

      for (let order of orders) {
        let subscriptionId = order.stripe_information.subscription_id;

        let subscription;

        if (subscriptionId) {
          subscription = await Stripe.getSubscription(subscriptionId);
        }

        // Check if the payment method the customer is trying to delete is the default payment method for the subscription.
        if (subscription?.default_payment_method === paymentMethodId) {
          return next(
            new HTTPError._403(
              'You cannot delete a payment method that is associated with an active order.'
            )
          );
        }
      }

      // If the payment method is not the default payment method for any active orders, then delete it.
      let paymentMethodDeleted = await Stripe.deletePaymentMethod(paymentMethodId, customerId);

      let response = {
        statusCode: 200,
        data: {
          deleted: true,
          deleted_payment_method: paymentMethodDeleted,
        },
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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information?.customer_id;

      console.log('customerId: ', customerId);

      if (customerId === null || customerId === undefined) {
        throw new HTTPError._400('No customer id found.');
      }

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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find((obj) => obj.Name === 'custom:company').Value;

      let company = await CompaniesDAO.queryOne({
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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find((obj) => obj.Name === 'custom:company').Value;

      let company = await CompaniesDAO.queryOne({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccount = await Stripe.getExternalAccount(accountId, externalAccountId);

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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find((obj) => obj.Name === 'custom:company').Value;

      let company = await CompaniesDAO.queryOne({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccount = await Stripe.getExternalAccount(accountId, externalAccountId);

      if (externalAccount.account !== accountId) {
        throw new HTTPError._403('You are not authorized to delete this external account.');
      }

      let externalAccountDeleted = await Stripe.deleteExternalAccount(accountId, externalAccountId);

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
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      let companyId = userAttributes.find((obj) => obj.Name === 'custom:company').Value;

      let company = await CompaniesDAO.queryOne({
        id: companyId,
      });

      let accountId = company.stripe_information.account_id;

      let Stripe = new StripeService();

      let externalAccounts = await Stripe.listExternalAccounts(accountId);
      externalAccounts = externalAccounts.data;

      let response = {
        statusCode: 200,
        data: externalAccounts,
      };

      next(response);
    } catch (error) {
      logger.error(error.stack);
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

  static async createSubscriptionWithPaymentMethod(req, res, next) {
    try {
      let response = {};

      let accessToken = req.headers.authorization.split(' ')[1];

      let orderId = req.params.id;

      let paymentMethodId = req.body.payment_method_id;

      let promotionCode = req.body.promotion_code;

      const billingDetails = req.body.billing_details;

      let Stripe = new StripeService();
      let StripeHelper = new stripeHelper(Stripe);

      // Convert orderId to string
      orderId = orderId.toString();

      const OrdersDAO = new ordersDAO();

      let order = await OrdersDAO.queryOne(
        { _id: { $eq: orderId } },

        [
          {
            path: 'company',
            model: 'Company',
          },
          {
            path: 'user',
            model: 'marketplace_user',
          },
        ]
      );

      // Check if the order has an existing subscription
      if (order?.stripe_information?.subscription_id) {
        return next(new HTTPError._400('Order already has a subscription'));
      }

      let accountId = order.company.stripe_information.account_id;

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information?.customer_id;

      // Convert amount to interger
      let amount = order.order_total;

      let stripeCustomer = await Stripe.getCustomer(customerId);
      let currency = stripeCustomer.currency || 'eur';
      let productId = STRIPE_PRODUCT_ID;
      let priceId;
      let coupon;

      /**
       * Check if any field is missing in req.body.billing_address
       */
      let taxId = req.body.billing_details.tax_id;

      if (taxId) {
        // Check if the customer already has the tax id
        let customerTaxIds = await Stripe.getCustomerTaxIds(customerId);

        let taxIdExists = false;

        let taxIdAux = 'PT' + taxId;

        for (let i = 0; i < customerTaxIds.data.length; i++) {
          if (customerTaxIds.data[i].value === taxIdAux) {
            taxIdExists = true;
            break;
          }
        }

        if (taxIdExists === false) {
          // Create a tax id for the customer

          try {
            await Stripe.createCustomerTaxId(customerId, taxId);
          } catch (err) {
            return next(new HTTPError._400(err.message));
          }
        }
      }

      /**
       * Create a price for the product.
       */
      try {
        priceId = await Stripe.createPrice(productId, amount, currency, 'month');

        priceId = priceId.id;
      } catch (err) {
        return next(new HTTPError._500(err.message));
      }

      let subscription;
      let promotionCodeExists;
      let newApplicationFee;

      if (promotionCode) {
        promotionCodeExists = await StripeHelper.getPromotionCodeByName(promotionCode);

        if (promotionCodeExists) {
          coupon = promotionCodeExists.coupon;

          try {
            newApplicationFee = await StripeHelper.calculateApplicationFeeWithPromotionCode(
              order.order_total,
              promotionCodeExists.id
            );
          } catch (err) {
            switch (err.type) {
              case 'INVALID_PARAMETER':
                throw new HTTPError._400(err.message);

              default:
                throw new HTTPError._500(err.message);
            }
          }

          try {
            subscription = await Stripe.createSubscription(
              customerId,
              priceId,
              accountId,
              newApplicationFee,
              paymentMethodId,
              promotionCodeExists.id
            );
          } catch (err) {
            switch (err.type) {
              default:
                throw new HTTPError._500(err.message);
            }
          }
        } else {
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

        /**
         * Attach the stripe subscription id to the order.
         */
        await OrdersDAO.update(order);
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
              return next(new HTTPError._500(err.message));
          }
        }
      }

      // Attach the stripe subscription id to the order.
      order.stripe_information.subscription_id = subscription.id;

      // Attach tbe billing details to the order.
      order.billing_details = billingDetails;

      // Update the order
      await OrdersDAO.update(order);

      // Check if the charge succeeded
      if (subscription?.latest_invoice?.payment_intent?.last_payment_error?.code) {
        logger.info('CHECKOUT ERROR');
        return next(
          new HTTPError._400(subscription.latest_invoice.payment_intent.last_payment_error.message)
        );
      }

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      next(response);
    } catch (err) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(err.message));
    }
  }

  static async updateSubscriptionPaymentMethod(req, res, next) {}

  static async validateCoupon(req, res, next) {
    try {
      let response = {};

      let coupon = req.body.coupon;

      let Stripe = new StripeService();

      let coupons = await Stripe.listCoupons();

      // Check if the coupon exists
      let couponExists = coupons.find((c) => c.name === coupon);

      if (!couponExists) {
        response.statusCode = 404;
        response.data = {
          message: 'Coupon not found.',
        };
      } else {
        response.statusCode = 200;
        response.data = {
          coupon: {
            name: couponExists.name,

            currency: couponExists.currency,

            ammount_off: couponExists.amount_off,
            percent_off: couponExists.percent_off,
          },
        };
      }
      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async listCoupons(req, res, next) {
    let response = {};
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

  static async createCardToken(req, res, next) {
    let response = {};
    try {
      let Stripe = new StripeService();

      let cardToken = await Stripe.createCardToken(req.body.card);

      response.statusCode = 200;
      response.data = cardToken;
      next(response);
    } catch (err) {
      next(err);
    }
  }
}
