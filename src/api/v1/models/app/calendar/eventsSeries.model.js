import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventsSeriesSchema = new Schema(
  
  {
    _id: Schema.Types.ObjectId,

    user: { type: Schema.ObjectId, ref: "user", required: true },

    start_date: { type: Date, required: true },

    end_date: {
      type: Date,
      required: true,
      default: Date.now() + 31536000000,
    },

    // Weekly or Biweekly
    recurrency_type: { type: String, required: false, enum: ["weekly", "biweekly","monthly"] },

    // If isRecurrent is true, this is the frequency of the order
    // If isRecurrent is false, this is the date of the order
    schedule: [
      {
        week_day: { type: String, required: true, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
        start_time: { type: String, required: true },
        end_time: { type: String, required: true },
      },
    ],

    created_at: { type: Date, required: true, default: Date.now() },
    updated_at: { type: Date, required: true, default: Date.now() },
  },
  {
    timestamps: true,
  }
);

/**
 * Methods
 */

const getWeekDayNumber = (weekDay) => {
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
  };
  
  // Helper function to get the next recurrent date based on the recurrency type
  const getNextRecurrentDate = (date, recurrencyType) => {
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
  };
  
  // Helper function to get the date from the week date and the week day number
  const getDateFromWeekDateAndWeekDayNumber = (weekDate, weekDayNumber) => {
    const newDate = new Date(weekDate);
    newDate.setDate(
      newDate.getDate() + ((weekDayNumber + 7 - newDate.getDay()) % 7)
    );
    return newDate;
  };
  
  // Helper function to get the next Monday date from a date
  const getNextMondayDate = (date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + ((1 + 7 - newDate.getDay()) % 7));
    return newDate;
  };
  
  // Helper function to get the next Monday date from a date in 2 weeks
  // Example: if the provided date is 2022-12-15T00:00:00.000Z the next Monday date in 2 weeks is 2022-12-26T00:00:00.000Z
  const getNextMondayDateIn2Weeks = (date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + ((1 + 7 - newDate.getDay()) % 7) + 7);
    return newDate;
  };
  
  // Method to create events from the order schedule (from order start date to order end date)
  eventsSeriesSchema.methods.createEvents = async function () {
    const scheduleInformation = this.scheduleInformation;
  
   
    // Convert start and end dates to Date objects
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
  
    // Initialize array to hold events
    let events = [];
  
      // Set the current date to the start date
      let currentDate = start;
  
      // Handle the first week
      // Loop through the schedule array
      for (const event of schedule) {
        const eventStartDate = getDateFromWeekDateAndWeekDayNumber(
          currentDate,
          getWeekDayNumber(event.weekDay)
        );
        const eventEndDate = getDateFromWeekDateAndWeekDayNumber(currentDate, 7);
  
        if (eventStartDate <= eventEndDate) {
          // Create an event object based on the event information
          let newEvent = new eventSchema({
            user: this.user,
            order: this._id,
  
            title: "",
            description: "",
            startDate: eventStartDate,
            endDate: eventStartDate,
            startTime: event.startTime,
            endTime: event.endTime,
          });
  
          // Add the event object to the events array
          events.push(newEvent);
        }
      }
  
      console.log("Current date: ", currentDate);
  
      if (recurrencyType === "weekly") {
        currentDate = getNextMondayDate(currentDate);
      }
      if (recurrencyType === "biweekly") {
        currentDate = getNextMondayDateIn2Weeks(currentDate);
      }
      console.log("Current date: ", currentDate);
  
      // Loop through dates until the current date is past the end date
      while (currentDate <= end) {
        // Loop through the schedule array
        for (const event of schedule) {
          const eventStartDate = getDateFromWeekDateAndWeekDayNumber(
            currentDate,
            getWeekDayNumber(event.weekDay)
          );
  
          if (eventStartDate <= end) {
            // Get the week day for the current date
            const currentWeekDay = currentDate.getDay();
  
            // Get the week day for the event
            const eventWeekDay = getWeekDayNumber(event.weekDay);
  
            // Create an event object based on the event information
            let newEvent = new eventSchema({
              user: this.user,
              order: this._id,
  
              title: "",
              description: "",
              startDate: eventStartDate,
              endDate: eventStartDate,
              startTime: event.startTime,
              endTime: event.endTime,
            });
  
            // Add the event object to the events array
            events.push(newEvent);
          }
        }
  
        // Increment the current date based on the recurrency type
        currentDate = getNextRecurrentDate(currentDate, recurrencyType);
      }
  
      // Sort the events array by date
      events.sort((a, b) => a.startDate - b.startDate);
  
      // Return the events array
      return events;
    
  
    // Helper functions
    // Helper function to get the number for a week day (e.g. Monday = 1, Tuesday = 2, etc.)
  };

export default eventsSeriesSchema;
