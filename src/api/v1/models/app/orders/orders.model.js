import mongoose from "mongoose";
import eventSeriesSchema from "../calendar/eventsSeries.model.js";

let Order;

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    company: { type: Schema.ObjectId, ref: "Company", required: true },

    caregiver: { type: Schema.ObjectId, ref: "User", required: false },

    // The customer is the user that is paying for the order
    customer: { type: Schema.ObjectId, ref: "User", required: true },

    // The client is the user that is receiving the service (home care support).
    client: { type: Schema.ObjectId, ref: "Relative", required: true },

    // New -> Customer Created Order && Pending Company Acceptance
    // Pending -> Company Accepted && Schedule Visit Process
    // Canceled -> Company Canceled || Customer Canceled
    // Active -> Visit Done && Customer Paid
    // Inactive -> Order Was Active && (Company Canceled || Customer Canceled)
    order_status: { type: String, required: true, default: "new" },

    services: [{ type: Schema.ObjectId, ref: "Service", required: true }],

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

      

      // 0 -> Every 0 weeks -> Not recurrent, one time only order.
      // 1 -> Every 1 week -> Weekly
      // 2 -> Every 2 weeks -> Biweekly
      // 4 -> Every 4 weeks -> Monthly
      recurrency_type: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 4],
      },

      // If isRecurrent is true, this is the frequency of the order
      // If isRecurrent is false, this is the date of the order
      // week_day must be a number betwen 1 and 7
      schedule: [
        {
          week_day: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6, 7]},
          start_time: { type: String, required: true },
          end_time: { type: String, required: true },
        },
      ],
    },

    screening_visit: {
      date: { type: Date, required: false },
       // Pending; Scheduled; completed; Canceled
      status: { type: String, required: true, default: "pending" },
      event: { type: Schema.ObjectId, ref: "Event", required: false },
     
      
    },

    actual_start_date: { type: Date, required: false },

    observations: { type: String, required: false },

    stripe_subscription_id: { type: String, required: true },

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

