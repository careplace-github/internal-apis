import mongoose from "mongoose";
import eventSeriesSchema from "../calendar/eventsSeries.model.js";

import ObjectId from "mongodb";

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    company: { type: Schema.ObjectId, ref: "company", required: false },

    caregiver: { type: Schema.ObjectId, ref: "user", required: false },

    // The customer is the user that is paying for the order
    customer: { type: Schema.ObjectId, ref: "user", required: true },

    // The client is the user that is receiving the service (home care support).
    client: { type: Schema.ObjectId, ref: "relative", required: true },

    // Pending -> Company Accepted && Schedule Visit Process
    // Canceled -> Company Canceled || Customer Canceled
    // Active -> Visit Done && Customer Paid
    // Inactive -> Order Was Active && (Company Canceled || Customer Canceled)
    orderStatus: { type: String, required: true, default: "pending" },

    services: [{ type: Schema.ObjectId, ref: "service", required: true }],

    companyAccepted: { type: Boolean, required: true, default: false },

    screeningVisit: {
      date: { type: Date, required: false },
      event: { type: Schema.ObjectId, ref: "event", required: false },
      // Pending; Scheduled; Done
      status: { type: String, required: true, default: "pending" },
    },

    observations: { type: String, required: false },

    files: [{ type: Schema.ObjectId, ref: "file", required: false }],

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

      // Only applies if isRecurrent is true
      hoursPerWeek: { type: Number, required: false },
      hoursPerMonth: { type: Number, required: false },
      visitsPerWeek: { type: Number, required: false },
      visitsPerMonth: { type: Number, required: false },
    },

    // Json with all the information about the payment
    // TODO: Add payment information
    paymentInformation: {
      orderTotal: { type: Number, required: true, default: 0 },
      orderCurrency: { type: String, required: true, default: "EUR" },

      stripeInformation: {
        stripe_company_id: { type: String, required: false },
        stripe_customer_id: { type: String, required: false },
        stripe_subscription_id: { type: String, required: false },
        stripe_payment_link: { type: String, required: false },
      },

      invoices: [
        {
          invoiceId: { type: String, required: false },
          invoiceDate: { type: Date, required: false },
          invoiceAmount: { type: Number, required: false },
          invoiceStatus: { type: String, required: false },
        },
      ],
    },

    billingAddress: {
      street: { type: String, required: true },

      postalCode: { type: String, required: true },

      state: { type: String, required: true },

      city: { type: String, required: true },

      country: { type: String, required: true },

      countryId: { type: String, required: true },

      fullAddress: { type: String, required: true },
    },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },
  {
    timestamps: true,
  }
);

/**
 * Methods
 */

// Create an EventSeries for the order
orderSchema.methods.createEventSeries = async function () {
  const eventSeries = new eventSeriesSchema({
    _id: new mongoose.Types.ObjectId(),

    user: this.caregiver,
    startDate: this.scheduleInformation.startDate,
    endDate: this.scheduleInformation.endDate,
    recurrencyType: this.scheduleInformation.recurrencyType,
    schedule: this.scheduleInformation.schedule,
  });
  return eventSeries;
};

export default orderSchema;
