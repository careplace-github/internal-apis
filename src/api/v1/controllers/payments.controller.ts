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
} from 'src/packages/database';
import { AuthHelper, EmailHelper, OrdersHelper, StripeHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICaregiver,
  ICaregiverDocument,
  IHealthUnit,
  IHealthUnitDocument,
  ICustomer,
  IEventSeries,
  IHomeCareOrder,
  IHomeCareOrderDocument,
  IPatient,
  IService,
  IServiceDocument,
} from 'src/packages/interfaces';
import {
  CustomerModel,
  EventSeriesModel,
  HomeCareOrderModel,
  ServiceModel,
} from 'src/packages/models';
import { CognitoService, SESService, StripeService } from 'src/packages/services';
import { AuthUtils } from 'src/packages/utils';
import { HTTPError, DateUtils } from '@utils';

// @constants
import {
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  STRIPE_APPLICATION_FEE,
  STRIPE_PRODUCT_ID,
} from '@constants';
// @logger
import logger from '@logger';
// @data
import { services } from '@assets';
import Stripe from 'stripe';

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
  static CognitoService = new CognitoService(AWS_COGNITO_BUSINESS_CLIENT_ID);
  // utils
  static AuthUtils = AuthUtils;
  static DateUtils = DateUtils;

  // -------------------------------------------------- //
  //                       TOKENS                       //
  // -------------------------------------------------- //

  static async createCardToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      let cardToken: Stripe.Token;

      let params: Stripe.TokenCreateParams = {
        card: {
          number: req.body.card_number,
          exp_month: req.body.exp_month,
          exp_year: req.body.exp_year,
          cvc: req.body.cvc,
        },
      };

      try {
        cardToken = await StripeService.createCardToken(params);
      } catch (error: any) {
        switch (error.code) {
          default:
            return next(new HTTPError._400('Invalid card information.'));
        }
      }

      response.statusCode = 200;
      response.data = cardToken;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  // -------------------------------------------------- //
  //                  PAYMENT METHODS                   //
  // -------------------------------------------------- //

  static async createPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      let billingDetails = req.body.billing_details;

      let user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._401('You are not authorized to perform this action.'));
      }

      let customerId = user.stripe_information.customer_id;

      let createPaymentMethodParams: Stripe.PaymentMethodCreateParams = {
        type: 'card',
        card: {
          token: paymentMethodToken,
        },
        billing_details: {
          name: billingDetails?.name,
          email: billingDetails?.email,
          phone: billingDetails?.phone,
          address: billingDetails?.address
            ? {
                line1: billingDetails?.address?.line1,
                line2: billingDetails.address?.line2,
                city: billingDetails?.address?.city,
                state: billingDetails?.address?.state,
                postal_code: billingDetails?.address?.postal_code,
                country: billingDetails?.address?.country,
              }
            : undefined,
        },
      };

      let createPaymentMethod: Stripe.PaymentMethod;

      try {
        createPaymentMethod = await PaymentsController.StripeService.createPaymentMethodWithToken(
          createPaymentMethodParams
        );
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      let paymentMethodAttached: Stripe.PaymentMethod;

      try {
        paymentMethodAttached =
          await PaymentsController.StripeService.attachPaymentMethodToCustomer(
            createPaymentMethod.id,
            customerId
          );
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = paymentMethodAttached;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async retrievePaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      let paymentMethodId = req.params.paymentMethod;

      let paymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
        paymentMethodId
      );

      response.statusCode = 200;
      response.data = paymentMethod;

      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async deletePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      let paymentMethodId = req.params.paymentMethod;

      let user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._401('You are not authorized to perform this action.'));
      }

      let customerId = user.stripe_information.customer_id;

      // Check if the payment method is attached to the customer trying to delete it.
      let paymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
        paymentMethodId
      );

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

      const orders = (
        await PaymentsController.HomeCareOrdersDAO.queryList({
          // queryList returns 402 if no results so we don't need error handling
          filters,
        })
      ).data;

      for (let order of orders) {
        let subscriptionId = order.stripe_information.subscription_id;

        let subscription;

        if (subscriptionId) {
          subscription = await PaymentsController.StripeService.getSubscription(subscriptionId);
        }

        // Check if the payment method the customer is trying to delete is the default payment method for the subscription.
        if (subscription?.default_payment_method === paymentMethodId) {
          return next(
            new HTTPError._409(
              'You cannot delete a payment method that is associated with an active order.'
            )
          );
        }
      }

      // If the payment method is not the default payment method for any active orders, then delete it.
      let paymentMethodDeleted = await PaymentsController.StripeService.deletePaymentMethod(
        paymentMethodId
      );

      response.statusCode = 200;
      response.data = {
        deleted: true,
        deleted_payment_method: paymentMethodDeleted,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  static async listPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._401('You are not authorized to perform this action.'));
      }

      let customerId = user.stripe_information?.customer_id;

      console.log('customerId: ', customerId);

      if (customerId === null || customerId === undefined) {
        throw new HTTPError._400('No customer id found.');
      }

      let paymentMethods = await PaymentsController.StripeService.listPaymentMethods(customerId);

      response.statusCode = 200;
      response.data = paymentMethods;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      next(error);
    }
  }

  // -------------------------------------------------- //
  //                    SUBSCRIPTIONS                   //
  // -------------------------------------------------- //

  static async createSubscriptionWithPaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      let orderId = req.params.order as string;

      let paymentMethodId = req.body.payment_method as string;

      if (!paymentMethodId) {
        throw new HTTPError._400('No payment method id provided.');
      }

      let promotionCodeName = req.body.promotion_code as string;

      const billingDetails = req.body.billing_details;

      // Convert orderId to string

      let order = await PaymentsController.HomeCareOrdersDAO.queryOne(
        { _id: { $eq: orderId } },

        [
          {
            path: 'health_unit',
            model: 'HealthUnit',
          },
          {
            path: 'customer',
            model: 'Customer',
          },
        ]
      );

      // Check if the order has an existing subscription
      if (order?.stripe_information?.subscription_id) {
        return next(new HTTPError._409('Order already has a subscription'));
      }

      let paymentMethod: Stripe.PaymentMethod;

      try {
        paymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
          paymentMethodId
        );
      } catch (error: any) {
        switch (error.type) {
          case 'StripeInvalidRequestError':
            return next(new HTTPError._400(error.message));
          default:
            return next(new HTTPError._400(error.message));
        }
      }

      let healthUnitAccountId = order.health_unit.stripe_information.account_id;

      let user = await AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        // User is not a customer
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      if (paymentMethod.customer !== user.stripe_information?.customer_id) {
        // Payment method does not belong to the user
        return next(new HTTPError._403('You are not authorized to perform this action'));
      }

      let customerId = user.stripe_information?.customer_id;

      // Convert amount to interger
      let amount = order.order_total;

      if (!amount) {
        return next(new HTTPError._400('No order amount provided.'));
      }

      let stripeCustomer = await PaymentsController.StripeService.getCustomer(customerId);
      let currency = 'eur';
      let productId = STRIPE_PRODUCT_ID;
      let priceId: string;
      let subscription: Stripe.Subscription | undefined;
      let coupon: Stripe.Coupon | undefined;

      /**
       * Check if any field is missing in req.body.billing_address
       */
      let taxId = req.body.billing_details.tax_id;

      if (taxId) {
        // Check if the customer already has the tax id
        let customerTaxIds = await PaymentsController.StripeService.getCustomerTaxIds(customerId);

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
            await PaymentsController.StripeService.createCustomerTaxId(customerId, taxId);
          } catch (err: any) {
            return next(new HTTPError._400(err.message));
          }
        }
      }

      let createPriceParams: Stripe.PriceCreateParams = {
        unit_amount: amount,
        currency: currency,
        recurring: {
          interval: 'month',
        },
        product: productId,
        metadata: {
          order_id: orderId,
        },
      };

      /**
       * Create a price for the product.
       */
      try {
        priceId = (await PaymentsController.StripeService.createPrice(createPriceParams)).id;
      } catch (err: any) {
        return next(new HTTPError._500(err.message));
      }

      let promotionCodeExists: Stripe.PromotionCode | undefined;
      let newApplicationFee: number;

      const createSubscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'], // expand the latest invoice payment intent
        application_fee_percent: parseInt(STRIPE_APPLICATION_FEE),
        transfer_data: {
          destination: healthUnitAccountId,
        },
        collection_method: 'charge_automatically', // automatically charge the customer's card for each invoice
      };

      let createSubscriptionParamsWithPromotionCode: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        default_payment_method: paymentMethodId,
        coupon: undefined,
        expand: ['latest_invoice.payment_intent'], // expand the latest invoice payment intent
        application_fee_percent: parseInt(STRIPE_APPLICATION_FEE), // default application fee, the new application fee will be calculated based on the promotion code
        transfer_data: {
          destination: healthUnitAccountId,
        },
        collection_method: 'charge_automatically', // automatically charge the customer's card for each invoice
      };

      if (promotionCodeName) {
        promotionCodeExists = await PaymentsController.StripeHelper.getPromotionCodeByName(
          promotionCodeName
        );

        if (promotionCodeExists && promotionCodeExists.coupon.amount_off) {
          coupon = promotionCodeExists.coupon;
          createSubscriptionParamsWithPromotionCode.coupon = coupon.id;

          try {
            logger.info('AMOUNT: ' + amount / 100);
            logger.info('COUPON: ' + JSON.stringify(coupon, null, 2));

            const paymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
              paymentMethodId
            );

            const paymentMethodAux = {
              type: paymentMethod.type,
              country: paymentMethod?.card?.country || '',
            };
            logger.info('PAYMENT METHOD: ' + JSON.stringify(paymentMethodAux, null, 2));

            const amountOff = promotionCodeExists.coupon.amount_off / 100;
            const orderTotal = amount / 100;

            let amounts;
            try {
              amounts = PaymentsController.OrdersHelper.calculateAmounts(
                orderTotal,
                paymentMethodAux,
                amountOff
              );
            } catch (err: any) {
              return next(new HTTPError._400(err.message));
            }

            newApplicationFee = amounts.application_fee;

            logger.info('NEW APPLICATION FEE: ' + newApplicationFee);

            // Create a subscription with a promotion code
            subscription = await PaymentsController.StripeService.createSubscription(
              createSubscriptionParamsWithPromotionCode
            );

            // Check if the subscription is active
            if (subscription.status === 'active') {
              // Update the subscription with the normal application fee
              const updateSubscriptionParams: Stripe.SubscriptionUpdateParams = {
                application_fee_percent: parseInt(STRIPE_APPLICATION_FEE),
              };
              await PaymentsController.StripeService.updateSubscription(
                subscription.id,
                updateSubscriptionParams
              );
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
            // Create a subscription without a promotion code

            subscription = await PaymentsController.StripeService.createSubscription(
              createSubscriptionParams
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
          subscription = await PaymentsController.StripeService.createSubscription(
            createSubscriptionParams
          );
        } catch (err: any) {
          switch (err.type) {
            default:
              return next(new HTTPError._500(err.message));
          }
        }
      }

      if (!subscription) {
        return next(new HTTPError._500('Error creating subscription'));
      }
      // Attach the stripe subscription id to the order.
      order.stripe_information.subscription_id = subscription.id;

      // Attach tbe billing details to the order.
      order.billing_details = billingDetails;

      // Update the order
      PaymentsController.HomeCareOrdersDAO.update(order);

      const invoice = subscription.latest_invoice as Stripe.Invoice;

      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      logger.info(
        'paymentIntent?.last_payment_error?.code' + paymentIntent?.last_payment_error?.code
      );

      logger.info('subscription.status' + subscription.status);

      // Check if the charge succeeded
      if (paymentIntent?.last_payment_error?.code || subscription.status === 'incomplete') {
        // Charge failed, return an error
        return next(new HTTPError._402('Payment Required.'));
      }

      // Charge succeeded, change the order status to active
      else {
        // Change the order status to active
        order.status = 'active';

        // Update the order
        PaymentsController.HomeCareOrdersDAO.update(order);
      }

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(err.message));
    }
  }

  static async updateSubscriptionPaymentMethod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      const user = await PaymentsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const orderId = req.params.order;
      const paymentMethodId = req.body.payment_method;

      let subscriptionId: string;
      let order: IHomeCareOrderDocument;
      let paymentMethod: Stripe.PaymentMethod;
      let subscription: Stripe.Subscription;

      try {
        order = await PaymentsController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      if (order.customer.toString() !== user.id.toString()) {
        return next(new HTTPError._403('Order does not belong to the user.'));
      }

      if (!order?.stripe_information?.subscription_id) {
        return next(new HTTPError._400('Order does not have a subscription.'));
      } else {
        subscriptionId = order.stripe_information.subscription_id;
      }

      try {
        paymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
          paymentMethodId
        );
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Payment method not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      if (paymentMethod.customer !== user.stripe_information.customer_id) {
        return next(new HTTPError._400('Payment method does not belong to the user.'));
      }

      try {
        subscription = await PaymentsController.StripeService.updateSubscription(subscriptionId, {
          default_payment_method: paymentMethodId,
        });
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Subscription not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      next(err);
    }
  }

  static async chargeSubscriptionOpenInvoice(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      const user = await PaymentsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const orderId = req.params.order;

      let order: IHomeCareOrderDocument;
      let subscription: Stripe.Subscription;
      let invoice: Stripe.Invoice;

      try {
        order = await PaymentsController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      if (order.customer.toString() !== user.id.toString()) {
        return next(new HTTPError._403('Order does not belong to the user.'));
      }

      if (!order?.stripe_information?.subscription_id) {
        return next(new HTTPError._400('Order does not have a subscription.'));
      } else {
        subscription = await PaymentsController.StripeService.getSubscription(
          order.stripe_information.subscription_id
        );
      }

      // Get the latest invoice id
      const latestInvoiceId = subscription.latest_invoice as string;

      if (!latestInvoiceId) {
        return next(new HTTPError._400('Subscription does not have an invoice.'));
      }

      // Get the invoice
      let latestInvoice: Stripe.Invoice;

      try {
        latestInvoice = await PaymentsController.StripeService.getInvoice(latestInvoiceId);
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Invoice not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      // Check if the invoice is paid
      if (latestInvoice.status === 'paid') {
        return next(new HTTPError._409('Invoice is already paid.'));
      }

      try {
        invoice = await PaymentsController.StripeService.chargeInvoice(latestInvoiceId);
      } catch (err: any) {
        switch (err.type) {
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      // The payment was successful, change the order status to active
      order.status = 'active';

      // Update the order
      await PaymentsController.HomeCareOrdersDAO.update(order);

      response.statusCode = 200;
      response.data = {
        payment_intent: invoice,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      next(err);
    }
  }

  // TODO cancelSubscription
  static async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      const user = await PaymentsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const orderId = req.params.order;

      let order: IHomeCareOrder;
      let subscription: Stripe.Subscription;

      try {
        order = await PaymentsController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      if (order.customer.toString() !== user.id.toString()) {
        return next(new HTTPError._403('Order does not belong to the user.'));
      }

      if (!order?.stripe_information?.subscription_id) {
        return next(new HTTPError._400('Order does not have a subscription.'));
      } else {
        subscription = await PaymentsController.StripeService.getSubscription(
          order.stripe_information.subscription_id
        );
      }

      if (subscription.status !== 'active') {
        return next(new HTTPError._400('Subscription is not active.'));
      }

      // TODO Check if there are any pending invoices and cancel them
      if (subscription.pending_invoice_item_interval) {
        // Get the latest invoice id
        const latestInvoiceId = subscription.latest_invoice as string;
      }

      try {
        subscription = await PaymentsController.StripeService.cancelSubscription(
          order.stripe_information.subscription_id
        );
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Subscription not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      next(err);
    }
  }

  static async addSubscriptionCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
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

      const user = await PaymentsController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CustomerModel)) {
        return next(new HTTPError._403('You are not authorized to perform this action.'));
      }

      const orderId = req.params.order;
      const promotionCodeId = req.body.promotion_code;

      let order: IHomeCareOrder;
      let subscription: Stripe.Subscription;
      let promotionCode: Stripe.PromotionCode;
      let coupon: Stripe.Coupon;

      try {
        order = await PaymentsController.HomeCareOrdersDAO.retrieve(orderId);
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Order not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      if (order.customer.toString() !== user.id.toString()) {
        return next(new HTTPError._403('Order does not belong to the user.'));
      }

      if (!order?.stripe_information?.subscription_id) {
        return next(new HTTPError._400('Order does not have a subscription.'));
      } else {
        subscription = await PaymentsController.StripeService.getSubscription(
          order.stripe_information.subscription_id
        );
      }

      if (subscription.status !== 'active') {
        return next(new HTTPError._400('Subscription is not active.'));
      }

      // Get the promotion code
      try {
        promotionCode = await PaymentsController.StripeService.getPromotionCode(promotionCodeId, {
          expand: ['coupon'],
        });
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Coupon not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      let amounts;

      let defaultPaymentMethod: Stripe.PaymentMethod;

      try {
        defaultPaymentMethod = await PaymentsController.StripeService.retrievePaymentMethod(
          subscription.default_payment_method as string
        );
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Payment method not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      const paymentMethodAux = {
        type: defaultPaymentMethod.type || '',
        country: defaultPaymentMethod.card?.country || '',
      };

      const orderTotal = order.order_total;
      const discount = promotionCode.coupon.amount_off || undefined;

      let newApplicationFee: number;

      try {
        amounts = PaymentsController.OrdersHelper.calculateAmounts(
          orderTotal,
          paymentMethodAux,
          discount
        );
      } catch (err: any) {
        return next(new HTTPError._400(err.message));
      }

      newApplicationFee = amounts.application_fee;

      response.statusCode = 200;
      response.data = {
        subscription: subscription,
      };

      // Add the coupon to the subscription
      try {
        subscription = await PaymentsController.StripeService.updateSubscription(subscription.id, {
          coupon: promotionCode.coupon.id,
          application_fee_percent: newApplicationFee,
        });
      } catch (err: any) {
        switch (err.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Subscription not found.'));
          default:
            return next(new HTTPError._500(err.message));
        }
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      // Pass to the next middleware to handle the error
      next(err);
    }
  }

  // -------------------------------------------------- //
  //              COUPONS / PROMOTION CODES             //
  // -------------------------------------------------- //

  static async validatePromotionCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      let reqPromotionCode = req.body.promotion_code;

      let promotionCodes = (
        await PaymentsController.StripeService.listPromotionCodes(
          // expand the coupon object
          { expand: ['data.coupon'] }
        )
      ).data;

      // Check if the coupon exists
      let promotionCodeExists = promotionCodes.find((c) => c.code === reqPromotionCode);

      if (!promotionCodeExists) {
        response.statusCode = 404;
        response.data = {
          message: 'Promotion code not found.',
        };
      } else {
        response.statusCode = 200;
        response.data = {
          coupon: {
            name: promotionCodeExists.code,

            currency: promotionCodeExists.coupon.currency,

            ammount_off: promotionCodeExists.coupon?.amount_off
              ? promotionCodeExists.coupon.amount_off / 100
              : 0,
            percent_off: promotionCodeExists.coupon?.percent_off
              ? promotionCodeExists.coupon.percent_off
              : 0,

            duration: promotionCodeExists.coupon.duration,
            duration_in_months: promotionCodeExists.coupon.duration_in_months,

            max_redemptions: promotionCodeExists.coupon.max_redemptions,
          },
        };
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (err: any) {
      next(err);
    }
  }
}
