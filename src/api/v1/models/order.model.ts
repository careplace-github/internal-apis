// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IOrder } from '../interfaces';

const orderSchema: Schema<IOrder> = new Schema<IOrder>(
  {
    _id: Schema.Types.ObjectId,
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    caregiver: { type: Schema.Types.ObjectId, ref: 'Caregiver', required: false },
    user: { type: Schema.Types.ObjectId, ref: 'marketplace_users', required: true },
    relative: { type: Schema.Types.ObjectId, ref: 'Relative', required: true },
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
    address: {
      street: { type: String, required: true },
      postal_code: { type: String, required: true },
      state: { type: String, required: false },
      city: { type: String, required: true },
      country: { type: String, required: true, enum: ['PT', 'ES', 'US', 'UK'] },
      coordinates: { type: Array, required: true },
    },
    screening_visit: { type: Schema.Types.ObjectId, ref: 'Event', required: false, default: null },
    observations: { type: String, required: false, default: null },
    stripe_subscription_id: { type: String, required: false, default: null },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const OrderModel: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default OrderModel;

export { orderSchema };
