import mongoose from "mongoose";
import eventSeriesSchema from "../calendar/eventsSeries.model.js";

let Order;

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    company: { type: Schema.ObjectId, ref: "Company", required: true },

    caregiver: { type: Schema.ObjectId, ref: "Caregiver", required: false },

    // The customer is the user that is paying for the order
    user: { type: Schema.ObjectId, ref: "marketplace_users", required: true },

    // The client is the user that is receiving the service (home care support).
    relative: { type: Schema.ObjectId, ref: "Relative", required: true },

    services: [{ type: Schema.ObjectId, ref: "Service", required: true }],

    // Json with all the information about the order schedule
    schedule_information: {
      start_date: { type: Date, required: true },

      // If isRecurrent is true, this is the end date of the order
      // The default value is 1 year after the start date
      end_date: {
        type: Date,
        required: false,
        default: null,
      },

      // 0 -> Every 0 weeks -> Not recurrent, one time only order.
      // 1 -> Every 1 week -> Weekly
      // 2 -> Every 2 weeks -> Biweekly
      // 4 -> Every 4 weeks -> Monthly
      recurrency: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 4],
      },

      // If isRecurrent is true, this is the frequency of the order
      // If isRecurrent is false, this is the date of the order
      // week_day must be a number betwen 1 and 7
      schedule: [
        {
          week_day: {
            type: Number,
            required: true,
            enum: [1, 2, 3, 4, 5, 6, 7],
          },
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
      ],
    },

    /**
     * Address of the client (relative) that is receiving the service.
     */

    // new -> Order Created
    // declined -> Company Declined
    // canceled -> Customer Canceled
    // accepted -> Company Accepted
    // payment_pending -> Company Accepted, waiting for payment
    // active -> Payment received, order is active
    status: { type: String, required: true, default: "new", enum: ["new", "declined", "cancelled", "accepted", "pending_payment", "active", "completed"] },

    decline_reason: { type: String, required: false },

    order_total: { type: Number, required: false },

    address: {
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

    screening_visit: {
      type: Schema.ObjectId,
      ref: "Event",
      required: false,
      default: null,
    },

    observations: { type: String, required: false, default: null },

    stripe_subscription_id: { type: String, required: false, default: null },
  },
  {
    timestamps: true,
    virtuals: true,
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

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Order = mongoose.model("Order", orderSchema);
