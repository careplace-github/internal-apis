// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, Types, startSession } from 'mongoose';

// @api
import {
  CaregiversDAO,
  CustomersDAO,
  HealthUnitsDAO,
  HealthUnitReviewsDAO,
  HomeCareOrdersDAO,
  PatientsDAO,
  CollaboratorsDAO,
  EventSeriesDAO,
} from '@api/v1/db';
import { AuthHelper, EmailHelper, OrdersHelper, StripeHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICaregiver,
  ICaregiverModel,
  IHealthUnit,
  IHealthUnitModel,
  ICustomer,
  IEventSeries,
  IHomeCareOrder,
  IHomeCareOrderModel,
  IPatient,
  IService,
  IServiceModel,
} from '@api/v1/interfaces';
import { EventSeriesModel, HomeCareOrderModel, ServiceModel } from '@api/v1/models';
import { CognitoService, SESService, StripeService } from '@api/v1/services';
import { HTTPError, AuthUtils, DateUtils } from '@api/v1/utils';
// @constants
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  STRIPE_APPLICATION_FEE,
  STRIPE_PRODUCT_ID,
} from '@constants';
// @logger
import logger from '@logger';
// @data
import { services } from '@assets';

export default class PaymentsController {
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();
  static CustomersDAO = new CustomersDAO();
  static CaregiversDAO = new CaregiversDAO();
  static HealthUnitsDAO = new HealthUnitsDAO();
  static CollaboratorsDAO = new CollaboratorsDAO();
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  static EventSeriesDAO = new EventSeriesDAO();
  static PatientsDAO = new PatientsDAO();
  // helpers
  static AuthHelper = AuthHelper;
  static EmailHelper = EmailHelper;
  static OrdersHelper = OrdersHelper;
  static StripeHelper = StripeHelper;
  // services
  static SES = SESService;
  static StripeService = StripeService;
  static CognitoService = new CognitoService(AWS_COGNITO_CRM_CLIENT_ID);
  // utils
  static AuthUtils = AuthUtils;
  static DateUtils = DateUtils;

  static async createCustomerPaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let paymentMethodToken = req.body.payment_method_token;

      let billingAddress = req.body.billing_address;

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      let createPaymentMethod = await this.StripeService.createPaymentMethodWithToken(
        'card',
        paymentMethodToken,
        billingAddress
      );

      let paymentMethodAttached = await this.StripeService.attachPaymentMethodToCustomer(
        createPaymentMethod.id,
        customerId
      );

      response = {
        statusCode: 200,
        data: paymentMethodAttached,
      };

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async retrieveCustomerPaymentMethod(req, res, next) {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let paymentMethodId = req.params.id;

      let paymentMethod = await this.StripeService.getPaymentMethod(paymentMethodId);

      response = {
        statusCode: 200,
        data: paymentMethod,
      };

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteCustomerPaymentMethod(req, res, next) {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let paymentMethodId = req.params.id;

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information.customer_id;

      // Check if the payment method is attached to the customer trying to delete it.
      let paymentMethod = await this.StripeService.getPaymentMethod(paymentMethodId);

      if (paymentMethod.customer !== customerId) {
        logger.info('paymentMethod.customer: ' + paymentMethod.customer);
        logger.info('customerId: ' + customerId);
        return next(new HTTPError._403('You are not authorized to delete this payment method.'));
      }

      let filters = {
        user: user._id,
        // status should be active or pending_payment
        status: ['active', 'pending_payment'],
      };

      let orders = (
        await this.HomeCareOrdersDAO.queryList({
          filters,
        })
      ).data;

      for (let order of orders) {
        let subscriptionId = order.stripe_information.subscription_id;

        let subscription;

        if (subscriptionId) {
          subscription = await this.StripeService.getSubscription(subscriptionId);
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
      let paymentMethodDeleted = await this.StripeService.deletePaymentMethod(paymentMethodId);

      response = {
        statusCode: 200,
        data: {
          deleted: true,
          deleted_payment_method: paymentMethodDeleted,
        },
      };

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async listCustomerPaymentMethods(req, res, next) {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };
      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information?.customer_id;

      console.log('customerId: ', customerId);

      if (customerId === null || customerId === undefined) {
        throw new HTTPError._400('No customer id found.');
      }

      let paymentMethods = await this.StripeService.listPaymentMethods(customerId);

      response = {
        statusCode: 200,
        data: paymentMethods,
      };

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async createSubscriptionWithPaymentMethod(req, res, next) {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };
      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      let orderId = req.params.id;

      let paymentMethodId = req.body.payment_method_id;

      let promotionCode = req.body.promotion_code;

      const billingDetails = req.body.billing_details;

      // Convert orderId to string
      orderId = orderId.toString();

      let order = await this.HomeCareOrdersDAO.queryOne(
        { _id: { $eq: orderId } },

        [
          {
            path: 'health_unit',
            model: 'HealthUnit',
          },
          {
            path: 'user',
            model: 'marketplace_user',
          },
        ]
      );

      // Check if the order has an existing subscription
      if (order?.stripe_information?.subscription_id) {
        return next(new HTTPError._409('Order already has a subscription'));
      }

      let paymentMethod;

      try {
        paymentMethod = await this.StripeService.getPaymentMethod(paymentMethodId);
      } catch (error: any) {
        switch (error.type) {
          case 'StripeInvalidRequestError':
            return next(new HTTPError._400(error.message));
          default:
            return next(new HTTPError._400(error.message));
        }
      }

      let accountId = order.health_unit.stripe_information.account_id;

      let user = await AuthHelper.getUserFromDB(accessToken);

      let customerId = user.stripe_information?.customer_id;

      // Convert amount to interger
      let amount = order.order_total;

      let stripeCustomer = this.StripeService.getCustomer(customerId);
      let currency = 'eur';
      let productId = STRIPE_PRODUCT_ID;
      let priceId;
      let coupon;

      /**
       * Check if any field is missing in req.body.billing_address
       */
      let taxId = req.body.billing_details.tax_id;

      if (taxId) {
        // Check if the customer already has the tax id
        let customerTaxIds = await this.StripeService.getCustomerTaxIds(customerId);

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
            this.StripeService.createCustomerTaxId(customerId, taxId);
          } catch (err: any) {
            return next(new HTTPError._400(err.message));
          }
        }
      }

      /**
       * Create a price for the product.
       */
      try {
        priceId = this.StripeService.createPrice(productId, amount, currency, 'month');

        priceId = priceId.id;
      } catch (err: any) {
        return next(new HTTPError._500(err.message));
      }

      let subscription;
      let promotionCodeExists;
      let newApplicationFee;

      if (promotionCode) {
        promotionCodeExists = this.StripeHelper.getPromotionCodeByName(promotionCode);

        if (promotionCodeExists) {
          coupon = promotionCodeExists.coupon;

          try {
            logger.info('AMOUNT: ' + amount / 100);
            logger.info('COUPON: ' + JSON.stringify(coupon, null, 2));

            const paymentMethod = await this.StripeService.getPaymentMethod(paymentMethodId);

            const paymentMethodAux = {
              type: paymentMethod.type,
              country: paymentMethod?.card?.country || '',
            };

            logger.info('PAYMENT METHOD: ' + JSON.stringify(paymentMethodAux, null, 2));

            const discount = {
              coupon: promotionCode,
              amount_off: coupon.amount_off / 100,
            };

            const orderTotal = amount / 100;

            let amounts;
            try {
              amounts = this.OrdersHelper.calculateAmounts(orderTotal, paymentMethodAux, discount);
            } catch (err: any) {
              return next(new HTTPError._400(err.message));
            }

            newApplicationFee = amounts.application_fee;

            logger.info('NEW APPLICATION FEE: ' + newApplicationFee);

            // Create a subscription with a promotion code
            subscription = this.StripeService.createSubscription(
              customerId,
              priceId,
              accountId,
              newApplicationFee,
              paymentMethodId,
              promotionCodeExists.id
            );

            // Check if the subscription is active
            if (subscription.status === 'active') {
              // Update the subscription with the normal application fee
              const options = {
                application_fee_percent: STRIPE_APPLICATION_FEE,
              };
              this.StripeService.updateSubscription(subscription.id, options);
            }
          } catch (err: any) {
            switch (err.type) {
              case 'INVALID_PARAMETER':
                next(new HTTPError._400(err.message));

              default:
                next(new HTTPError._500(err.message));
            }
          }
        } else {
          // If the promotion code does not exist, handle the scenario here
          // Perform the necessary operations for creating a subscription without a promotion code
          try {
            subscription = this.StripeService.createSubscription(
              customerId,
              priceId,
              accountId,
              parseInt(STRIPE_APPLICATION_FEE),
              paymentMethodId,
              undefined
            );
          } catch (err: any) {
            switch (err.type) {
              default:
                return next(new HTTPError._500(err.message));
            }
          }
        }
      } else {
        // If no promotion code is provided, handle the scenario here
        // Perform the necessary operations for creating a subscription without a promotion code
        try {
          subscription = this.StripeService.createSubscription(
            customerId,
            priceId,
            accountId,
            parseInt(STRIPE_APPLICATION_FEE),
            paymentMethodId,
            undefined
          );
        } catch (err: any) {
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
      this.HomeCareOrdersDAO.update(order);

      // Check if the charge succeeded
      if (subscription?.latest_invoice?.payment_intent?.last_payment_error?.code) {
        if (
          subscription.latest_invoice.payment_intent.last_payment_error.message ===
          'Your card was declined.'
        ) {
          next(
            new HTTPError._402(
              subscription.latest_invoice.payment_intent.last_payment_error.message
            )
          );
        } else {
          return next(
            new HTTPError._400(
              subscription.latest_invoice.payment_intent.last_payment_error.message
            )
          );
        }
      }

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(err.message));
    }
  }

  static async updateSubscriptionPaymentMethod(req, res, next) {}

  static async validatePromotionCode(req, res, next) {
    try {
      let response: IAPIResponse = {
        statusCode: 102, // request received
        data: {},
      };
      let coupon = req.body.coupon;

      let coupons = await this.StripeService.listCoupons();

      logger.info('COUPONS: ' + JSON.stringify(coupons, null, 2));

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
    } catch (err: any) {
      next(err);
    }
  }
}
