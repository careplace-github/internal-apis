import { readFileSync, promises as fsPromises } from "fs";
import fs from "fs";

// Import logger
import logger from "../../../logs/logger.js";



export default class DateUtils {
 

    static async getLastWeek(date){
        let lastWeek = new Date(date);
        lastWeek.setDate(date.getDate() - 7);

        let lastWeekDays = [];

        for(let i = 0; i < 7; i++){

            let day = new Date(lastWeek);
            day.setDate(lastWeek.getDate() + i);

            lastWeekDays.push(day);

        }


        return {
            week: lastWeek,
            days: lastWeekDays,
        };
    };

  static async getWeekDayNumber(weekDay) {
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

  static async getNextRecurrentDate(date, recurrencyType){};

 }