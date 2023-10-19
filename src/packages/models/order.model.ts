// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IOrderDocument } from '../interfaces';

const OrderSchema: Schema<IOrderDocument> = new Schema<IOrderDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    order_number: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: ['home_care', 'medical_equipment', 'nursing_home', 'senior_residence', 'day_center'],
    },

    source: {
      type: String,
      required: true,
      enum: ['marketplace', 'lead', 'external'],
    },

    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: false },
    caregiver: { type: Schema.Types.ObjectId, ref: 'Caregiver', required: false },
    customer: { type: Schema.Types.ObjectId, ref: 'marketplace_users', required: false },
    patient: { type: Schema.Types.ObjectId, ref: 'patient', required: false },

    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: false }],
    schedule_information: {
      start_date: { type: Date, required: false },
      end_date: { type: Date, required: false, default: null },
      recurrency: { type: Number, required: false, enum: [0, 1, 2, 4] },
      schedule: [
        {
          week_day: { type: Number, required: false, enum: [1, 2, 3, 4, 5, 6, 7] },
          start: { type: Date, required: false },
          end: { type: Date, required: false },
        },
      ],
    },
    status: {
      type: String,
      required: true,
      default: 'new',
      enum: ['new', 'declined', 'cancelled', 'accepted', 'pending_payment', 'active', 'completed'],
    },
    decline_reason: { type: String, required: false }, // heal unit reason to decline the order
    cancellation_reason: { type: String, required: false }, // customer reason to cancel the order

    cancelledAt: { type: Date, required: false }, // date when the order was cancelled
    declinedAt: { type: Date, required: false }, // date when the order was declined
    acceptedAt: { type: Date, required: false }, // date when the order was accepted
    visitScheduledAt: { type: Date, required: false }, // date when the visit was scheduled
    quoteSentAt: { type: Date, required: false }, // date when the quote was sent
    completedAt: { type: Date, required: false }, // date when the order was completed

    order_total: { type: Number, required: false },

    visits: [{ type: Schema.Types.ObjectId, ref: 'Event', required: false, default: [] }],
    observations: { type: String, required: false, default: null },
    stripe_information: {
      subscription_id: { type: String, required: false, default: null },
    },
    billing_details: {
      name: { type: String, required: false, default: null },
      email: { type: String, required: false, default: null },
      address: {
        street: { type: String, required: false, default: null },
        postal_code: { type: String, required: false, default: null },
        state: { type: String, required: false, default: null },
        city: { type: String, required: false, default: null },
        country: { type: String, required: false, default: null },
      },
      tax_id: { type: String, required: false, default: null },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const OrderModel: Model<IOrderDocument> = mongoose.model<IOrderDocument>('Order', OrderSchema);

export { OrderSchema, OrderModel };
