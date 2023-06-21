import { readFileSync, promises as fsPromises } from "fs";
import fs from "fs";

// Import logger
import logger from "../../../../logs/logger";

/**
 * Class with utility functions for dates.
 */
export default class DateUtils {
  async getWeekDayNumber(weekDay) {
    switch (weekDay) {
      case "Monday":
        return 1;
      case "Tuesday":
        return 2;
      case "Wednesday":
        return 3;
      case "Thursday":
        return 4;
      case "Friday":
        return 5;
      case "Saturday":
        return 6;
      case "Sunday":
        return 7;
      default:
        throw new Error(`Invalid week day: ${weekDay}`);
    }
  }

  // Helper function to get the next recurrent date based on the recurrency type
  async getNextRecurrentDate(date, recurrencyType) {
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
  async getDateFromWeekDateAndWeekDayNumber(weekDate, weekDayNumber) {
    const newDate = new Date(weekDate);
    newDate.setDate(
      newDate.getDate() + ((weekDayNumber + 7 - newDate.getDay()) % 7)
    );
    return newDate;
  }

  // Helper function to get the next Monday date from a date
  async getNextMondayDate(date) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + ((1 + 7 - newDate.getDay()) % 7));
    return newDate;
  }

  // Helper function to get the next Monday date from a date in 2 weeks
  // Example: if the provided date is 2022-12-15T00:00:00.000Z the next Monday date in 2 weeks is 2022-12-26T00:00:00.000Z
  async getNextMondayDateIn2Weeks(date) {
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
  async getScheduleRecurrencyText(schedule) {
    console.log(`SCHEDULE: ${JSON.stringify(schedule)}`);

    let response = "";

    let weekDays = [
      "Segundas-feiras",
      "Terças-feiras",
      "Quartas-feiras",
      "Quintas-feiras",
      "Sextas-feiras",
      "Sábados",
      "Domingos",
    ];

    for (let i = 0; i < schedule.length; i++) {
      const scheduleItem = schedule[i];

      const weekDay = scheduleItem.week_day;

      const start = scheduleItem.start;
      const end = scheduleItem.end;

      const weekDayText = weekDays[weekDay - 1];

      const startText = await this.getTimeFromDate(start);
      const endText = await this.getTimeFromDate(end);

      response += `${weekDayText}: ${startText} - ${endText}`;
    }

    console.log(`SCHEDULE RESPONSE : ${response}`);

    return response;
  }

  /**
   * @example
   * input: 1674260545
   * 1674260545 = 2023-01-21T00:00:00.000Z
   * output: Jan 21, 2023
   *
   * @see https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
   */
  async getDateFromUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
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
  async convertDateToReadableString(date) {
    date = new Date(date);

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  async convertDateToReadableString2(date) {
    date = new Date(date);

    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
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
  async getTimeFromDate(date) {
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
    } else if (hours >= 10 && minutes < 10) {
      /**
       * @example
       * 08:5 -> 08:05
       */
      return `${hours}:0${minutes}`;
    } else if (hours < 10 && minutes < 10) {
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
