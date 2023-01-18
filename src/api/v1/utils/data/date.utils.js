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
      case "weekly":
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
        break;
      case "biweekly":
        newDate.setDate(newDate.getDate() + 14);
        return newDate;
        break;
      case "monthly":
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
}
