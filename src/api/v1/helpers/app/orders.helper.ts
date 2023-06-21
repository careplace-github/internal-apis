import { v4 as uuidv4 } from 'uuid';
import { IEventSeries, IEvent } from '../../interfaces';
import caregiversDAO from '../../db/caregivers.dao';
import logger from '../../../../logs/logger';

export async function generateEventsFromSeries(eventSeries: IEventSeries) {
  try {
    let events: IEvent[] = [];
    const CaregiversDAO = new caregiversDAO();

    const caregiver = await CaregiversDAO.retrieve(eventSeries.caregiver);

    if (!caregiver) {
      throw new Error('Caregiver not found');
    }

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
          day.start.getTime() + getRecurrencyIncrement(eventSeries.recurrency_type, multiplier)
        );
        const endDate = new Date(
          day.end.getTime() + getRecurrencyIncrement(eventSeries.recurrency_type, multiplier)
        );

        // If the start date is later than the series end date, stop creating events
        if (startDate > seriesEndDate) {
          break;
        }

        // Create a new event
        const event: IEvent = {
          _id: uuidv4(),
          series: eventSeries._id,
          order: eventSeries.order,
          caregiver: {
            _id: caregiver._id,
            name: caregiver.name,
            profile_picture: caregiver.profile_picture,
          },

          type: 'company',
          title: eventSeries.title,
          description: eventSeries.description,
          start: startDate,
          end: endDate,
          allDay: eventSeries.allDay,
          location: eventSeries.location,
          textColor: eventSeries.textColor,
        };

        // Add the event to the list of events
        events.push(event);
      }
    }
    // ---------------------------------------------------

    return events;
  } catch (err) {
    logger.error('ERROR ORDERS HELPER: ', err);
    throw err;
  }
}

function getRecurrencyIncrement(
  recurrencyType: IEventSeries['recurrency_type'],
  multiplier = 1
): number {
  const increment: number = getIncrementValue(recurrencyType, multiplier);
  const incrementMillis: number = increment * 24 * 60 * 60 * 1000; // Convert increment to milliseconds

  return incrementMillis;
}

function getIncrementValue(
  recurrencyType: IEventSeries['recurrency_type'],
  multiplier = 1
): number {
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
