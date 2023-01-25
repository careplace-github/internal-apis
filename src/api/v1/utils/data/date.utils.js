import { readFileSync, promises as fsPromises } from "fs";
import fs from "fs";

// Import logger
import logger from "../../../../logs/logger.js";

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
   * startTime: "08:00",
   * endTime: "12:00",
   * },
   * {
   * weekDay: 3,
   * startTime: "08:00",
   * endTime: "12:00",
   * },
   * {
   * weekDay: 6,
   * startTime: "08:00",
   * endTime: "12:00",
   * },
   * ]
   *
   * response = `Segundas-feiras: 08:00 - 12:00; Quartas-feiras: 08:00 - 12:00; Sextas-feiras: 08:00 - 12:00`;
   */
  async getScheduleRecurrencyText(schedule) {
    console.log(`SCHEDULE: ${JSON.stringify(schedule)}`);

    const weekDayNumberToWeekDayText = {
      1: "Segundas-feiras",
      2: "Terças-feiras",
      3: "Quartas-feiras",
      4: "Quintas-feiras",
      5: "Sextas-feiras",
      6: "Sábados",
      7: "Domingos",
    };

    let response = "";

    // Order the schedule by week day
    schedule.sort((a, b) => a.week_day - b.week_day);

    for (let i = 0; i < schedule.length; i++) {
      const scheduleItem = schedule[i];

      const weekDayText = weekDayNumberToWeekDayText[scheduleItem.week_day];
      const startTime = scheduleItem.start_time;
      const endTime = scheduleItem.end_time;

      if (i === 0) {
        response += `${weekDayText}: ${startTime} - ${endTime}`;
      } else {
        response += `; ${weekDayText}: ${startTime} - ${endTime}`;
      }
    }

    console.log(`SCHEDULE RESPONSE : ${response}`);

    return response;
  }

  /**
   * @example
   * input: 1674260545
   * 1674260545 = 2023-01-21T00:29:05.000Z
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
}
