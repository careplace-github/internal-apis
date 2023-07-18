// express
import { Request, Response, NextFunction } from 'express';

// Import Services
import stripe from '../../../../../packages/services/stripe.service';

import * as Error from '../../../../../utils/errors/http/http-error';

import { buffer } from 'micro';

import {
  STRIPE_ACCOUNT_ENDPOINT_SECRET,
  STRIPE_CONNECT_ENDPOINT_SECRET,
} from '../../../../../config/constants/index';

import { StripeHelper, EmailHelper } from '@packages/helpers';
import dateUtils from '../../../../../utils/data/date.utils';

import { STRIPE_APPLICATION_FEE, STRIPE_PRODUCT_ID } from '../../../../../config/constants/index';
import { HomeCareOrdersDAO } from 'src/packages/database';
import { HTTPError } from '@utils';
import Stripe from 'stripe';
// @logger
import logger from '@logger';
import {
  IAPIResponse,
  ICustomer,
  IHomeCareOrder,
  IPatient,
} from '../../../../../packages/interfaces';

/**
 * Controller for Stripe Webhooks
 *
 * @see https://stripe.com/docs/connect/webhooks
 * @see https://stripe.com/docs/api/events
 * @see https://stripe.com/docs/webhooks/quickstart?lang=node
 * @see https://stripe.com/docs/webhooks/test
 */
export default class StripeWebhooksController {
  // db
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();
  // helpers
  static StripeHelper = StripeHelper;
  static EmailHelper = EmailHelper;
  // services
  static StripeService = stripe;
  // utils
  static DateUtils = dateUtils;

  /**
   * Handles Stripe Webhooks related to connected accounts
   *
   * @param {*} req
   * @param {*} res
   * @param {*} next
   *
   * @see https://stripe.com/docs/connect/webhooks
   * @see https://stripe.com/docs/connect/subscriptions#event-notifications-for-connect-and-subscriptions-integrations
   *
   */
  static async connect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let signature: string | string[];
      // stripe event
      let event: Stripe.Event;

      if (req.headers) {
        if (req.headers['stripe-signature']) {
          signature = req.headers['stripe-signature'];
        } else {
          return next(new HTTPError._401('Invalid signature.'));
        }
      } else {
        return next(new HTTPError._401('No headers found.'));
      }

      const payload = req.body;

      try {
        event = await StripeWebhooksController.StripeService.constructEvent(
          payload,
          signature,
          STRIPE_CONNECT_ENDPOINT_SECRET
        );
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._400('Webhook Error: ' + error.message));
        }
      }

      /**
       * Handle the Event Notifications for Connect Integration
       *
       * @see https://stripe.com/docs/connect/subscriptions#event-notifications-for-connect-and-subscriptions-integrations
       */
      switch (event.type) {
        /**
         * Occurs when a user disconnects from your account and can be used to trigger required cleanup on your server. Available for Standard accounts.
         */
        case 'account.application.deauthorized	':
          break;

        /**
         *	Allows you to monitor changes to connected account requirements and status changes. Available for Standard, Express, and Custom accounts.
         */
        case 'account.updated':
          break;

        /**
         *	If you use the Persons API, allows you to monitor changes to requirements and status changes for individuals. Available for Express and Custom accounts.
         */
        case 'person.updated':
          break;

        /**
         *	Occurs when a payment intent results in a successful charge. Available for all payments, including destination and direct charges
         */
        case 'payment_intent.succeeded':
          break;

        /**
         *	Occurs when your Stripe balance has been updated (for example, when funds you’ve added from your bank account are available for transfer to your connected account).
         */
        case 'balance.available':
          break;

        /**
         *Occurs when a bank account or debit card attached to a connected account is updated, which can impact payouts. Available for Express and Custom accounts.
         */
        case 'account.external_account.updated':
          break;

        /**
         *	Occurs when a payout fails. When a payout fails, the external account involved will be disabled, and no automatic or manual payouts can go through until the external account is updated.
         */
        case 'payout.failed':
          break;
      }

      /**
       * Handle the Event Notifications for Subscriptions Integration
       *
       * @see https://stripe.com/docs/connect/subscriptions#event-notifications-for-connect-and-subscriptions-integrations
       */
      switch (event.type) {
        /**
         * Sent when a Customer is successfully created.
         */
        case 'customer.created':
          break;

        /**
         *	Sent when the subscription is created. The subscription status may be incomplete if customer authentication is required to complete the payment or if you set payment_behavior to default_incomplete. For more details, read about subscription payment behavior.
         */
        case 'customer.subscription.created':
          break;

        /**
         * Sent when a customer’s subscription ends.
         */
        case 'customer.subscription.deleted':
          break;

        /**
         * 	Sent three days before the trial period ends. If the trial is less than three days, this event is triggered.
         */
        case 'customer.subscription.trial_will_end':
          break;

        /**
         * Sent when the subscription is successfully started, after the payment is confirmed. Also sent whenever a subscription is changed. For example, adding a coupon, applying a discount, adding an invoice item, and changing plans all trigger this event.
         */
        case 'customer.subscription.updated':
          break;

        /**
         * Sent when an invoice is created for a new or renewing subscription. If Stripe fails to receive a successful response to invoice.created, then finalizing all invoices with automatic collection is delayed for up to 72 hours. Read more about finalizing invoices.
         * Respond to the notification by sending a request to the Finalize an invoice API.
         */
        case 'invoice.created':
          break;

        /**
         * Sent when an invoice is successfully finalized and ready to be paid.
         * You can send the invoice to the customer. Read more about invoice finalization.
         * Depending on your settings, Stripe automatically charges the default payment method or attempts collection. Read more about emails after finalization.
         */
        case 'invoice.finalized':
          break;

        /**
         * The invoice couldn’t be finalized. Learn how to handle invoice finalization failures by reading the guide. Learn more about invoice finalization in the invoices overview guide.
         * Inspect the Invoice’s last_finalization_error to determine the cause of the error.
         * If you’re using Stripe Tax, check the Invoice object’s automatic_tax field.
         * If automatic_tax[status]=requires_location_inputs, the invoice can’t be finalized and payments can’t be collected. Notify your customer and collect the required customer location.
         * If automatic_tax[status]=failed, retry the request later.
         */

        case 'invoice.finalization_failed':
          break;

        /**
         * Sent when the invoice is successfully paid. You can provision access to your product when you receive this event and the subscription status is active.
         */
        case 'invoice.paid':
          const object = event.data.object as Stripe.Invoice;

          let subscriptionId = object.subscription;
          let chargeId = object.charge as string;

          let receipt = await StripeWebhooksController.StripeHelper.getReceipt(subscriptionId);

          let receiptDate = await StripeWebhooksController.DateUtils.getDateFromUnixTimestamp(
            object.created
          );

          let order: IHomeCareOrder | undefined;

          /**
           * The stripe subscription is first created and then a charge is made.
           * Only then the order is created in the database.
           * It might happen that the webhook is called before the order is created.
           * So we need to wait until the order is created.
           */
          while (undefined) {
            try {
              order = await StripeWebhooksController.HomeCareOrdersDAO.queryOne(
                {
                  stripe_subscription_id: subscriptionId,
                },
                [
                  {
                    path: 'patient',
                    model: 'Relative',
                  },
                  {
                    path: 'health_unit',
                    model: 'HealthUnit',
                  },
                  {
                    path: 'services',
                    model: 'Service',
                  },
                  {
                    path: 'user',
                    model: 'marketplace_user',
                  },
                ]
              );
            } catch (error: any) {
              switch (error.type) {
                case 'NOT_FOUND':
                  // Order hasn't been created yet
                  break;
                default:
                  return next(new HTTPError._500(error.message));
              }
            }

            // Wait 250ms before trying again to query the order
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          let orderServices: string;

          if (!order) {
            return next(new HTTPError._500('Order not found'));
          }

          // Create a string with the services names
          // Example: "Cleaning, Laundry, Shopping"
          orderServices = order.services
            .map((service) => {
              return service.name;
            })
            .join(', ');

          let birthdate = await StripeWebhooksController.DateUtils.convertDateToReadableString(
            (order.patient as IPatient).birthdate
          );

          let orderStart = await StripeWebhooksController.DateUtils.convertDateToReadableString2(
            order.schedule_information.start_date
          );

          let schedule = await StripeWebhooksController.DateUtils.getScheduleRecurrencyText(
            order.schedule_information.schedule
          );

          let receiptLink = await StripeWebhooksController.StripeHelper.getReceiptLink(
            subscriptionId
          );

          let paymentMethod =
            await StripeWebhooksController.StripeHelper.getPaymentMethodByChargeId(chargeId);

          let billingAddress =
            await StripeWebhooksController.StripeHelper.getBillingAddressByChargeId(chargeId);

          let userEmailPayload = {
            name: (order.customer as ICustomer).name,
            healthUnit: order.health_unit.business_profile.name,

            link: receiptLink,

            clientEmail: (order.customer as ICustomer).email,

            // Make sure that the ammounts have 2 decimal places
            subTotal:
              object && object.total_excluding_tax !== null
                ? (object.total_excluding_tax / 100).toFixed(2)
                : '0.00',
            taxAmount: object && object.tax !== null ? (object.tax / 100).toFixed(2) : '0.00',
            total: (object.total / 100).toFixed(2),

            orderNumber:
              object && object.number !== null ? object.number.replace('A53F4B19-', '') : '',
            receiptDate: receiptDate,

            paymentMethod:
              paymentMethod.card && paymentMethod.card.brand !== null
                ? paymentMethod.card.brand.toUpperCase()
                : 'SEPA Direct Debit',

            relativeName: (order.patient as IPatient).name,
            relativeBirthdate: birthdate,
            relativeMedicalInformation:
              (order.patient as IPatient).medical_conditions !== undefined &&
              (order.patient as IPatient).medical_conditions !== null
                ? (order.patient as IPatient).medical_conditions
                : 'n/a',

            relativeStreet: (order.patient as IPatient).address.street,
            relativeCity: (order.patient as IPatient).address.city,
            relativePostalCode: (order.patient as IPatient).address.postal_code,
            relativeCountry: (order.patient as IPatient).address.country,
          };

          let marketplaceOrderPayedEmail =
            await StripeWebhooksController.EmailHelper.getEmailTemplateWithData(
              'marketplace_order_payed',
              userEmailPayload
            );

          await StripeWebhooksController.EmailHelper.sendEmailWithAttachment(
            paymentMethod.billing_details.email,
            marketplaceOrderPayedEmail.subject,
            marketplaceOrderPayedEmail.htmlBody,
            null,
            [receipt],
            null,
            'orders@staging.careplace.pt'
          );

          let healthUnitEmailPayload = {
            name: order.health_unit.legal_information.director.name,
            healthUnit: order.health_unit.business_profile.name,

            link: `https://sales.careplace.pt/orders/${order._id}`,

            // Make sure that the ammounts have 2 decimal places
            subTotal:
              object && object.total_excluding_tax !== null
                ? (object.total_excluding_tax / 100).toFixed(2)
                : '0.00',
            taxAmount: object && object.tax !== null ? (object.tax / 100).toFixed(2) : '0.00',
            total: (object.total / 100).toFixed(2),

            orderStart: orderStart,
            orderSchedule: schedule,
            orderServices: orderServices,

            relativeName: (order.patient as IPatient).name,
            relativeBirthdate: birthdate,
            relativeMedicalInformation:
              (order.patient as IPatient).medical_conditions !== undefined &&
              (order.patient as IPatient).medical_conditions !== null
                ? (order.patient as IPatient).medical_conditions
                : 'n/a',

            relativeStreet: (order.patient as IPatient).address.street,
            relativeCity: (order.patient as IPatient).address.city,
            relativePostalCode: (order.patient as IPatient).address.postal_code,
            relativeCountry: (order.patient as IPatient).address.country,

            userName: (order.customer as ICustomer).name,
            userPhone: (order.customer as ICustomer).phone,
          };

          let businessOrderPayedEmail =
            await StripeWebhooksController.EmailHelper.getEmailTemplateWithData(
              'business_order_payed',
              healthUnitEmailPayload
            );

          await StripeWebhooksController.EmailHelper.sendEmailWithAttachment(
            paymentMethod.billing_details.email,
            businessOrderPayedEmail.subject,
            businessOrderPayedEmail.htmlBody,
            null,
            [receipt],
            null,
            'orders@staging.careplace.pt'
          );

          break;

        /**
         * Sent when the invoice requires customer authentication. Learn how to handle the subscription when the invoice requires action.
         */
        case 'invoice.payment_action_required':
          break;

        /**
         * A payment for an invoice failed. The PaymentIntent status changes to requires_action. The status of the subscription continues to be incomplete only for the subscription’s first invoice. If a payment fails, there are several possible actions to take:
         * Notify the customer. Read about how you can configure subscription settings to enable Smart Retries and other revenue recovery features.
         * If you’re using PaymentIntents, collect new payment information and confirm the PaymentIntent.
         * Update the default payment method on the subscription.
         */
        case 'invoice.payment_failed':
          break;

        /**
         * Sent a few days prior to the renewal of the subscription. The number of days is based on the number set for Upcoming renewal events in the Dashboard. You can still add extra invoice items, if needed.
         */
        case 'invoice.upcoming':
          break;

        /**
         * Sent when a payment succeeds or fails. If payment is successful the paid attribute is set to true and the status is paid. If payment fails, paid is set to false and the status remains open. Payment failures also trigger a invoice.payment_failed event.
         */
        case 'invoice.updated':
          logger.info('invoice.updated');
          break;

        /**
         * Sent when a PaymentIntent is created.
         */
        case 'payment_intent.created':
          break;

        /**
         * Sent when a PaymentIntent has successfully completed payment.
         */
        case 'payment_intent.succeeded':
          break;

        default:
        /**
         * Log unhandled events for debugging purposes and send an email to the developer account.
         */
      }

      response.statusCode = 200;
      response.data = { received: true };

      next(response);
    } catch (error: any) {
      next(error);
    }
  }
}
