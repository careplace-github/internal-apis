import fs, { readFileSync, promises as fsPromises } from 'fs';

// Import logger
import logger from '../../../logs/logger';

/**
 * Class with utility functions for dates.
 */
export default class DateUtils {
  static async getWeekDayNumber(weekDay) {
    switch (weekDay) {
      case 'Monday':
        return 1;
      case 'Tuesday':
        return 2;
      case 'Wednesday':
        return 3;
      case 'Thursday':
        return 4;
      case 'Friday':
        return 5;
      case 'Saturday':
        return 6;
      case 'Sunday':
        return 7;
      default:
        throw new Error(`Invalid week day: ${weekDay}`);
    }
  }

  // Helper function to get the next recurrent date based on the recurrency type
  static async getNextRecurrentDate(date, recurrencyType) {
    const newDate = new Date(date);
    switch (recurrencyType) {
      case 1:
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
        break;
      case 2:
        newDate.setDate(newDate.getDate() + 14);
        return newDate;
        break;
      case 4:
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
    }
  }

  // Helper function to get the date from the week date and the week day number
  static async getDateFromWeekDateAndWeekDayNumber(weekDate, weekDayNumber) {
    const newDate = new Date(weekDate);
    newDate.setDate(newDate.getDate() + ((weekDayNumber + 7 - newDate.getDay()) % 7));
    return newDate;
  }

  static async getNextWeekdayWithTimeFromDate(date, weekdayNumber) {
    const targetDate = new Date(date);
    const currentDay = targetDate.getUTCDay();

    if (currentDay === weekdayNumber) {
      // If the current day matches the target weekday, return the input date itself.
      return targetDate;
    }

    const daysUntilTargetWeekday = (weekdayNumber - currentDay + 7) % 7 || 7;
    targetDate.setUTCDate(targetDate.getUTCDate() + daysUntilTargetWeekday);
    return targetDate;
  }

  // Helper function to get the next Monday date from a date
  static async getNextMondayDate(date) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + ((1 + 7 - newDate.getDay()) % 7));
    return newDate;
  }

  // Helper function to get the next Monday date from a date in 2 weeks
  // Example: if the provided date is 2022-12-15T00:00:00.000Z the next Monday date in 2 weeks is 2022-12-26T00:00:00.000Z
  static async getNextMondayDateIn2Weeks(date) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + ((1 + 7 - newDate.getDay()) % 7) + 7);
    return newDate;
  }

  /**
   *
   * @example
   *
   * schedule = [
   * {
   * weekDay: 1,
   * start: "2020-10-10T08:00:00.000Z",
   * end: "2020-10-10T12:00:00.000Z",
   * },
   * {
   * weekDay: 3,
   * start: "2020-10-10T08:00:00.000Z",
   * end: "2020-10-10T12:00:00.000Z",
   * },
   * {
   * weekDay: 6,
   * start: "2020-10-10T08:00:00.000Z",
   * end: "2020-10-10T12:00:00.000Z",
   * },
   * ]
   *
   * response = `Segundas-feiras: 08:00 - 12:00; Quartas-feiras: 08:00 - 12:00; Sextas-feiras: 08:00 - 12:00`;
   */
  static async getScheduleRecurrencyText(schedule) {
    console.log(`SCHEDULE: ${JSON.stringify(schedule)}`);

    let response = '';

    const weekDays = [
      'Segundas-feiras',
      'Terças-feiras',
      'Quartas-feiras',
      'Quintas-feiras',
      'Sextas-feiras',
      'Sábados',
      'Domingos',
    ];

    for (let i = 0; i < schedule.length; i++) {
      const scheduleItem = schedule[i];

      const weekDay = scheduleItem.week_day;

      const { start } = scheduleItem;
      const { end } = scheduleItem;

      const weekDayText = weekDays[weekDay - 1];

      const startText = await this.getTimeFromDate(start);
      const endText = await this.getTimeFromDate(end);

      response += `${weekDayText}: ${startText} - ${endText}`;
    }

    console.log(`SCHEDULE RESPONSE : ${response}`);

    return response;
  }

  // fOrderRecurrency = order.schedule_information.recurrency === 1 ? 'Semanal' : order.schedule_information.recurrency === 2 ? 'Quinzenal' : order.schedule_information.recurrency === 4 ? 'Mensal' : 'N/A';

  static async getRecurrencyType(recurrency) {
    switch (recurrency) {
      case 0:
        return 'Pedido Único';
      case 1:
        return 'Semanal';
      case 2:
        return 'Quinzenal';
      case 4:
        return 'Mensal';
      default:
        return 'N/A';
    }
  }

  /**
   * @example
   * input: 1674260545
   * 1674260545 = 2023-01-21T00:00:00.000Z
   * output: Jan 21, 2023
   *
   * @see https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
   */
  static async getDateFromUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  /**
   *
   * 2023-01-21T00:29:05.000Z
   *
   * -> 21/01/2023
   *
   */
  static async convertDateToReadableString(date) {
    date = new Date(date);

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  static async convertDateToReadableString2(date) {
    date = new Date(date);

    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  /**
   * @example
   * input: "2023-01-21T08:30:00.000Z"
   * output: "08:30"
   */
  static async getTimeFromDate(date) {
    date = new Date(date);

    /**
     * The date is in UTC, so we need to convert it to the local timezone
     */
    date = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

    const hours = date.getHours();
    const minutes = date.getMinutes();

    /**
     * @example
     * 8:30 -> 08:30
     */
    if (hours < 10 && minutes >= 10) {
      return `0${hours}:${minutes}`;
    }
    if (hours >= 10 && minutes < 10) {
      /**
       * @example
       * 08:5 -> 08:05
       */
      return `${hours}:0${minutes}`;
    }
    if (hours < 10 && minutes < 10) {
      /**
       * @example
       * 8:5 -> 08:05
       */
      return `0${hours}:0${minutes}`;
    }

    /**
     * @example
     * 08:30 -> 08:30
     *
     * No need to add 0 to hours and minutes
     */
    return `${hours}:${minutes}`;
  }
}
