import { Document, Types } from 'mongoose';
import { IEventSeries, IEvent, ICaregiver, IEventDocument } from 'src/api/v1/interfaces';
import { HomeCareOrdersDAO } from '@api/v1/db';
import logger from 'src/logs/logger';

import { IHomeCareOrder } from 'src/api/v1/interfaces';
import { EventModel } from '@api/v1/models';

interface Amounts {
  order_total: number;
  discount_order_total: number | null;

  application_fee: number;
  stripe_processing_fees: {
    payments: {
      fixed_fee: number;
      percentage_fee: number;
      total_fee: number;
      total_fee_percentage: number;
    };
    total_fees: number;
    total_fees_percentage: number;
  };
  discount: number | null;
  connected_account_net: number;
  connected_account_earnings: number;
  connected_account_earnings_percentage: number;
  payment_method: {
    type: string;
    country: string;
  };
  careplace_net: number;
  careplace_earnings: number;
  careplace_earnings_percentage: number;
}

interface Discount {
  coupon: string;
  amount_off?: number;
}
export default class OrdersHelper {
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  static async generateEventsFromSeries(eventSeries: IEventSeries) {
    try {
      let events: IEventDocument[] = [];

      if (!eventSeries.order) {
        throw new Error('Order not found');
      }

      const orderId = eventSeries?.order?._id as string;

      // Get the order
      const order = await this.HomeCareOrdersDAO.retrieve(orderId, {
        path: 'caregiver',
        model: 'Caregiver',
        select: 'name profile_picture',
      });

      const orderData = {
        _id: order._id,
        caregiver: {
          _id: order?.caregiver?._id,
          name: (order?.caregiver as ICaregiver)?.name,
          profile_picture: (order?.caregiver as ICaregiver)?.profile_picture,
        },
      };

      // Get the start date of the series
      const seriesStartDate = new Date(eventSeries.start_date);

      // ----------------- SERIES END DATE -----------------
      // Default end date is 1 year after the start date
      let seriesEndDate = new Date(seriesStartDate.getTime()); // Create a new date object based on the given date
      seriesEndDate.setFullYear(seriesEndDate.getFullYear() + 1); // Set the year to one year after the given date

      // Series never ends
      if (eventSeries.end_series.ending_type === 0) {
        // Set end date 1 year after the start date
        seriesEndDate = new Date(seriesStartDate.getTime()); // Create a new date object based on the given date
        seriesEndDate.setFullYear(seriesEndDate.getFullYear() + 1); // Set the year to one year after the given date
      }

      // Series ends after a certain number of occurrences
      else if (eventSeries.end_series.ending_type === 1 && eventSeries.end_series.end_date) {
        const startDateAfter1Year = new Date(seriesStartDate.getTime()); // Create a new date object based on the given date
        startDateAfter1Year.setFullYear(startDateAfter1Year.getFullYear() + 1); // Set the year to one year after the given date

        // End date is later than 1 year after the start date
        if (new Date(eventSeries.end_series.end_date) > startDateAfter1Year) {
          // Set the end date to 1 year after the start date
          seriesEndDate = startDateAfter1Year;
        }
        // End date is earlier than 1 year after the start date
        if (new Date(eventSeries.end_series.end_date) < startDateAfter1Year) {
          // Set the end date to the given end date
          seriesEndDate = new Date(eventSeries.end_series.end_date);
        }
      }
      // ---------------------------------------------------

      // ----------------- SERIES SCHEDULE -----------------
      // Order the days of the week by day number
      //  eventSeries.schedule.sort((a, b) => a.start.getDay() - b.start.getDay());

      // The series end date is no later than 1 year after the start date (52 weeks)
      for (let multiplier = 0; multiplier < 52; multiplier++) {
        // For each day of the week
        for (const day of eventSeries.schedule) {
          //
          const startDate = new Date(
            day.start.getTime() + this.getRecurrencyIncrement(eventSeries.recurrency, multiplier)
          );
          const endDate = new Date(
            day.end.getTime() + this.getRecurrencyIncrement(eventSeries.recurrency, multiplier)
          );

          // If the start date is later than the series end date, stop creating events
          if (startDate > seriesEndDate) {
            break;
          }

          // Create a new event
          let event: IEvent = {
            // use mongoose _id instead of uuidv4() to link the event to the eventSeries._id
            _id: new Types.ObjectId(),

            ownerType: 'health_unit',
            owner: eventSeries.owner,
            title: eventSeries.title,
            description: eventSeries?.description || '',
            start: startDate,
            end: endDate,
            allDay: eventSeries.allDay,
            location: eventSeries.location,
            textColor: eventSeries.textColor,
          };

          let eventModel = new EventModel(event);

          const error = eventModel.validateSync();

          if (error) {
            throw error;
          }

          const eventObj: IEventDocument = eventModel.toObject();

          eventObj.event_series = eventSeries._id as Types.ObjectId;
          eventObj.order = orderData as IHomeCareOrder;

          // Add the event to the list of events
          events.push(eventObj);
        }
      }
      // ---------------------------------------------------

      return events;
    } catch (err) {
      logger.error('ERROR ORDERS HELPER: ', err);
      throw err;
    }
  }

  private static getIncrementValue(
    recurrencyType: IEventSeries['recurrency'],
    multiplier = 1
  ): number {
    logger.info('recurrencyType: ', recurrencyType);

    logger.info('typeof: ', typeof recurrencyType);

    switch (recurrencyType) {
      // Weekly (every 1 week)
      case 1:
        // 7 days
        return 7 * multiplier;
      // Biweekly (every 2 weeks)
      case 2:
        // 14 days
        return 14 * multiplier;
      // Monthly (every 4 weeks)
      case 4:
        // 28 days
        return 28 * multiplier;
      default:
        throw new Error('Invalid recurrency type');
    }
  }
  private static getRecurrencyIncrement(
    recurrencyType: IEventSeries['recurrency'],
    multiplier = 1
  ): number {
    const increment: number = this.getIncrementValue(recurrencyType, multiplier);
    const incrementMillis: number = increment * 24 * 60 * 60 * 1000; // Convert increment to milliseconds

    return incrementMillis;
  }

  static async calculateAmounts(
    orderTotal: number,
    paymentMethod: {
      type: string;
      country: string;
    },
    amountOff?: number
  ): Promise<Amounts | { error: { message: string; amountOff: number | null } }> {
    console.log(
      `calculateAmounts: orderTotal: ${orderTotal}, paymentMethod: ${paymentMethod}, discount: ${JSON.stringify(
        amountOff,
        null,
        2
      )}`
    );

    if (paymentMethod.type !== 'card') {
      throw new Error('Payment method currently not supported.');
    }

    /**
     * Stripe has different fees for EU and non-EU cards.
     *
     * Right now we only support card from Portugal (PT) to avoid currency conversion fees.
     *
     */
    if (
      paymentMethod.country !== 'PT' &&
      /**
       * @todo REMOVE THIS WHEN GOING LIVE
       */
      paymentMethod.country !== 'US'
    ) {
      throw new Error('Card country currently not supported.');
    }

    const BASE_APPLICATION_FEE = 15.0; // 15% base application fee
    const MIN_CAREPLACE_EARNINGS_PERCENTAGE = 5.0; // 5% minimum careplace earnings percentage

    let processingFeesPercentage = 0;

    /**
     * EU Fees:
     * fixed fee: 0.25€
     * percentage fee: 1.5
     *
     * Premium EU Fees:
     * fixed fee: 0.25€
     * percentage fee: 1.9
     *
     * There's no way to know if a card is EU or Premium EU.
     * Because of THAT we'll assume Premium EU fees for all EU cards.
     *
     * @see https://stripe.com/en-pt/pricing
     */
    const stripePercentageFee: number = 1.9; // 1.5% processing fee
    const stripeFixedFee: number = 0.25; // 0.25€ fixed fee

    processingFeesPercentage = stripePercentageFee;

    let applicationFee = BASE_APPLICATION_FEE;

    let stripeProcessingFees = orderTotal * (processingFeesPercentage / 100) + stripeFixedFee;

    let stripeTotalFeePercentage = Number(((stripePercentageFee / orderTotal) * 100).toFixed(2));

    let connectedAccountPercentage = 100 - applicationFee;
    let connectedAccountNet = orderTotal * (connectedAccountPercentage / 100);
    let connectedAccountEarnings = connectedAccountNet;
    let connectedAccountEarningsPercentage = Number(
      ((connectedAccountEarnings / orderTotal) * 100).toFixed(2)
    );

    let careplaceNet = Number(((orderTotal * applicationFee) / 100).toFixed(2));
    let careplaceEarnings = Number((careplaceNet - processingFeesPercentage).toFixed(2));
    let careplaceEarningsPercentage = Number(((careplaceEarnings / orderTotal) * 100).toFixed(2));

    let newApplicationFee = applicationFee;

    let discountOrderTotal = 0;

    if (amountOff) {
      discountOrderTotal = orderTotal - amountOff;

      const healthUnitPercentage = Number(
        (((orderTotal * ((100 - applicationFee) / 100)) / (orderTotal - amountOff)) * 100).toFixed(
          2
        )
      );
      console.log('NEW APPLICATION FEE: ' + applicationFee);

      stripeProcessingFees = Number(
        (discountOrderTotal * (stripePercentageFee / 100) + stripeFixedFee).toFixed(2)
      );

      stripeTotalFeePercentage = Number(
        ((stripeProcessingFees / discountOrderTotal) * 100).toFixed(2)
      );

      newApplicationFee = Number((100 - healthUnitPercentage).toFixed(2));

      careplaceEarningsPercentage = Number(
        (newApplicationFee - stripeTotalFeePercentage).toFixed(2)
      );

      careplaceNet = Number((discountOrderTotal * (newApplicationFee / 100)).toFixed(2));

      careplaceEarnings = Number(
        (discountOrderTotal * (careplaceEarningsPercentage / 100)).toFixed(2)
      );

      applicationFee = newApplicationFee;

      console.log('NEW APPLICATION FEE: ' + applicationFee);

      if (
        careplaceEarningsPercentage < MIN_CAREPLACE_EARNINGS_PERCENTAGE ||
        healthUnitPercentage <= 0
      ) {
        /**
         * Change the application fee to reflect the discount for the client and still maintain the 85% minimum earnings for the connected account
         * It should take into account the stripe processing fees
         */

        const application_fee = MIN_CAREPLACE_EARNINGS_PERCENTAGE + stripeTotalFeePercentage;

        const amount_off = amountOff;

        console.log('NEW APPLICATION FEE: ' + application_fee);

        const min_order_total = Number(
          (
            (amount_off - amount_off * (application_fee / 100)) /
            ((BASE_APPLICATION_FEE - application_fee) / 100)
          ).toFixed(2)
        );

        logger.info('x: ' + min_order_total);

        return {
          error: {
            message: `Can't apply coupon. The order must be a minimum of ${min_order_total} €.`,
            amountOff: amountOff || null,
          },
        };
      }
    }

    return {
      order_total: orderTotal,
      discount_order_total: discountOrderTotal || null,
      application_fee: applicationFee,
      payment_method: paymentMethod,
      stripe_processing_fees: {
        payments: {
          fixed_fee: stripeFixedFee,
          percentage_fee: stripePercentageFee,
          total_fee: stripeProcessingFees,
          total_fee_percentage: stripeTotalFeePercentage,
        },
        total_fees: stripeProcessingFees,
        total_fees_percentage: stripeTotalFeePercentage,
      },

      discount: amountOff || null,

      connected_account_net: connectedAccountNet,
      connected_account_earnings: connectedAccountEarnings,
      connected_account_earnings_percentage: connectedAccountEarningsPercentage,

      careplace_net: careplaceNet,
      careplace_earnings: careplaceEarnings,
      careplace_earnings_percentage: careplaceEarningsPercentage,
    };
  }
}
