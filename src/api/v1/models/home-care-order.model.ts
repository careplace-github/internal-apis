// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IHomeCareOrderDocument } from '../interfaces';

const HomeCareOrderSchema: Schema<IHomeCareOrderDocument> = new Schema<IHomeCareOrderDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: true },
    caregiver: { type: Schema.Types.ObjectId, ref: 'Caregiver', required: false },
    customer: { type: Schema.Types.ObjectId, ref: 'marketplace_users', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'patient', required: true },

    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    schedule_information: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: false, default: null },
      recurrency: { type: Number, required: true, enum: [0, 1, 2, 4] },
      schedule: [
        {
          week_day: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6, 7] },
          start: { type: Date, required: true },
          end: { type: Date, required: true },
        },
      ],
    },
    status: {
      type: String,
      required: true,
      default: 'new',
      enum: ['new', 'declined', 'cancelled', 'accepted', 'pending_payment', 'active', 'completed'],
    },
    decline_reason: { type: String, required: false },
    order_total: { type: Number, required: false },

    screening_visit: { type: Schema.Types.ObjectId, ref: 'Event', required: false, default: null },
    observations: { type: String, required: false, default: null },
    stripe_information: {
      subscription_id: { type: String, required: false, default: null },
    },
    billing_details: {
      name: { type: String, required: true, default: null },
      email: { type: String, required: true, default: null },
      address: {
        street: { type: String, required: true, default: null },
        postal_code: { type: String, required: true, default: null },
        state: { type: String, required: false, default: null },
        city: { type: String, required: true, default: null },
        country: { type: String, required: true, default: null },
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

const HomeCareOrderModel: Model<IHomeCareOrderDocument> = mongoose.model<IHomeCareOrderDocument>(
  'HomeCareOrder',
  HomeCareOrderSchema
);

export { HomeCareOrderSchema, HomeCareOrderModel };
