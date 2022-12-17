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
      paymentMethod: { type: String, required: true },
      paymentStatus: { type: String, required: true },
      paymentDate: { type: Date, required: true },
      paymentAmount: { type: Number, required: true },
      paymentVat: { type: Number, required: true },
      paymentCurrency: { type: String, required: true },
      paymentId: { type: String, required: true },
      paymentDescription: { type: String, required: true },
      paymentReceiptUrl: { type: String, required: true },
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

// Methods

// Create an array of events from the order based on the schedule information
// If the order is recurrent, create an event for each date in the schedule
// If the order is not recurrent, create an event for the date in the schedule
// The events should take into account the recurrency type and information
// Example of a recurrent order
// {
//     "scheduleInformation": {
//         "startDate": "2021-05-01T00:00:00.000Z",
//         "endDate": "2022-07-31T00:00:00.000Z",
//         "isRecurrent": true,
//         "recurrencyType": "weekly",
//         "schedule": [
//             {
//                 "weekDay": "Monday",
//                 "startTime": "08:00",
//                 "endTime": "09:00"
//             },
//             {
//                 "weekDay": "Thursday",
//                 "startTime": "10:00"
//                 "endTime": "14:00"
//             },
//             {
//                 "weekDay": "Friday",
//                 "startTime": "08:00",
//                 "endTime": "09:00"
//             }
//         ]
//     }
// }
// In this example, the order is recurrent and the recurrency type is weekly
// The order will be active from 2021-05-01 to 2022-07-31
// The order has 3 events each week on Monday, Thursday and Friday from 08:00 to 09:00, 10:00 to 14:00 and 08:00 to 09:00 respectively
// The events should be created for every week in the range of dates between the start date and the end date and respect the recurrency type (weekly in this case) . If the recurrency type is every 2 weeks, the events should be created every 2 weeks, etc.
// The method should return an array of events (eventSchema) that were created
orderSchema.methods.createEvents = async function () {
  const scheduleInformation = this.scheduleInformation;
  const { startDate, endDate, isRecurrent, recurrencyType, schedule } =
    scheduleInformation;

  // Convert start and end dates to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Initialize array to hold events
  const events = [];

  // Check if the order is recurrent
  if (isRecurrent) {
    // Set the current date to the start date
    let currentDate = start;

    // Loop through dates until the current date is past the end date
    while (currentDate <= end) {
      // Loop through the schedule array
      for (const event of schedule) {
        // Get the week day for the current date
        const currentWeekDay = currentDate.getDay();

        // Get the week day for the event
        const eventWeekDay = getWeekDayNumber(event.weekDay);

        // Check if the week day for the current date matches the week day for the event
        if (currentWeekDay === eventWeekDay) {
          // Create an event object based on the event information
          let newEvent = new eventSchema({
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,

            order: this._id,
            user: this.user,
            title: "",

            allDay: false,
          });

          // Add the event object to the events array
          events.push(newEvent);
        }
      }

      // Increment the current date based on the recurrency type
      currentDate = getNextRecurrentDate(currentDate, recurrencyType);
    }
  } else {
    // The order is not recurrent, so create a single event based on the schedule information
    const eventObject = {
      startTime: schedule[0].startTime,
      endTime: schedule[0].endTime,
      date: start,
    };
    events.push(eventObject);
  }

  return events;
};

// Helper function to get the number for a week day (e.g. Monday = 1, Tuesday = 2, etc.)
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
      break;
    case "biweekly":
      newDate.setDate(newDate.getDate() + 14);
      break;
    case "monthly":
      newDate.setMonth(newDate.getMonth() + 1);
  }
};

export default mongoose.model("order", userSchema);
