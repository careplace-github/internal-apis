import { Document, Types } from 'mongoose';
import {
  IEventSeries,
  IEvent,
  ICaregiver,
  IEventDocument,
  IOrder,
} from 'src/packages/interfaces';
import { HomeCareOrdersDAO } from 'src/packages/database';
import logger from 'src/logs/logger';

import { EventModel } from 'src/packages/models';

export default class CalendarHelper {
  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  static async generateEventsFromSeries(eventSeries: IEventSeries) {
    try {
      const events: IEventDocument[] = [];

      logger.info('eventSeries: ', eventSeries);

      if (!eventSeries.order) {
        return;
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

          // verify if the textColor is valid (hexadecimal) and if not, set the default color
          const textColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(eventSeries.textColor)
            ? eventSeries.textColor
            : '#1890FF';
          // Create a new event
          const event: IEvent = {
            // use mongoose _id instead of uuidv4() to link the event to the eventSeries._id
            _id: new Types.ObjectId(),

            owner_type: 'health_unit',
            owner: eventSeries.owner,
            title: eventSeries.title,
            description: eventSeries?.description || '',
            start: startDate,
            end: endDate,
            allDay: eventSeries.allDay,
            location: eventSeries.location,
            textColor,
          };

          const eventModel = new EventModel(event);

          const error = eventModel.validateSync();

          if (error) {
            throw error;
          }

          const eventObj: IEventDocument = eventModel.toObject();

          eventObj.event_series = eventSeries._id as Types.ObjectId;
          eventObj.order = orderData as IOrder;

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
}
