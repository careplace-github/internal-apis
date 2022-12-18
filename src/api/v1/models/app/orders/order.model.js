import mongoose from "mongoose";
import eventSchema from "../calendar/event.model.js";
import ObjectId from "mongodb";

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    company: { type: Schema.ObjectId, ref: "company", required: true },

    caregiver: { type: Schema.ObjectId, ref: "user", required: true },

    client: { type: Schema.ObjectId, ref: "user", required: true },

    companyAccepted: { type: Boolean, required: true, default: false },

    clientAccepted: { type: Boolean, required: true, default: false },

    services: [{ type: Schema.ObjectId, ref: "service", required: true }],

    // Json with all the information about the order schedule
    scheduleInformation: {
      startDate: { type: Date, required: true },

      // If isRecurrent is true, this is the end date of the order
      // The default value is 1 year after the start date
      endDate: {
        type: Date,
        required: true,
        default: Date.now() + 31536000000,
      },

      isRecurrent: { type: Boolean, required: true, default: false },

      // Weekly or Biweekly
      recurrencyType: { type: String, required: false },

      // If isRecurrent is true, this is the frequency of the order
      // If isRecurrent is false, this is the date of the order
      schedule: [
        {
          weekDay: { type: String, required: true },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
        },
      ],
    },

    // Json with all the information about the payment
    // TODO: Add payment information
    paymentInformation: {
      paymentMethod: { type: String, required: false },
      paymentStatus: { type: String, required: false },
      paymentDate: { type: Date, required: false },
      paymentAmount: { type: Number, required: false },
      paymentVat: { type: Number, required: false },
      paymentCurrency: { type: String, required: false },
      paymentId: { type: String, required: false },
      paymentDescription: { type: String, required: false },
      paymentReceiptUrl: { type: String, required: false },
    },

    // Pending, Active, Inactive
    orderStatus: { type: String, required: true, default: "pending" },

    billingAddress: {
      street: { type: String, required: false },

      postalCode: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: { type: String, required: false },

      countryId: { type: String, required: false },

      fullAddress: { type: String, required: false },
    },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },
  {
    timestamps: true,
  }
);

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
orderSchema.methods.createEvents = async function () {
  const scheduleInformation = this.scheduleInformation;

  const { startDate, endDate, isRecurrent, recurrencyType, schedule } =
    scheduleInformation;

  // Convert start and end dates to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Initialize array to hold events
  let events = [];

  // Check if the order is recurrent
  if (isRecurrent) {
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
  } else {
    // The order is not recurrent, so create a single event based on the schedule information
    const eventObject = {
      startTime: schedule[0].startTime,
      endTime: schedule[0].endTime,
      date: start,
    };
    events.push(eventObject);
  }

  // Helper functions
  // Helper function to get the number for a week day (e.g. Monday = 1, Tuesday = 2, etc.)
};

export default orderSchema;
