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

    // New -> Customer Created Order && Pending Company Acceptance
    // Pending -> Company Accepted && Schedule Visit Process
    // Canceled -> Company Canceled || Customer Canceled
    // Active -> Visit Done && Customer Paid
    // Inactive -> Order Was Active && (Company Canceled || Customer Canceled)
    order_status: { type: String, required: true, default: "new" },

    services: [{ type: Schema.ObjectId, ref: "service", required: true }],

    // Json with all the information about the order schedule
    schedule_information: {
      start_date: { type: Date, required: true },

      // If isRecurrent is true, this is the end date of the order
      // The default value is 1 year after the start date
      end_date: {
        type: Date,
        required: true,
        default: Date.now() + 31536000000,
      },

      is_recurrent: { type: Boolean, required: true, default: false },

      // Weekly  -> Every week
      // Biweekly -> Every 2 weeks
      // Monthly  -> Every month (every 4 weeks)
      recurrency_type: {
        type: String,
        required: false,
        enum: ["weekly,", "biweekly", "monthly"],
      },

      // If isRecurrent is true, this is the frequency of the order
      // If isRecurrent is false, this is the date of the order
      schedule: [
        {
          week_day: { type: String, required: true },
          start_time: { type: String, required: true },
          end_time: { type: String, required: true },
        },
      ],
    },

    screening_visit: {
      date: { type: Date, required: false },
      event: { type: Schema.ObjectId, ref: "event", required: false },
      // Pending; Scheduled; Done
      status: { type: String, required: true, default: "pending" },
    },

    actual_start_date: { type: Date, required: true },

    observations: { type: String, required: false },

    stripe_subscription_id: { type: String, required: false },

    billing_address: {
      street: { type: String, required: true },

      postal_code: { type: String, required: true },

      state: { type: String, required: false },

      city: { type: String, required: true },

      country: {
        type: String,
        required: true,
        enum: ["PT", "ES", "US", "UK"],
      },

      coordinates: { type: Array, required: true },
    },

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

orderSchema.methods.updateStripePaymentIntent = async function (
  paymentIntentId
) {
  this.paymentInformation.stripeInformation.stripe_payment_intent_id =
    paymentIntentId;
  return this.save();
};

export default orderSchema;
