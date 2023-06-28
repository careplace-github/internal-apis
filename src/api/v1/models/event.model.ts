// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IEvent } from '../interfaces';

const eventSchema: Schema<IEvent> = new Schema<IEvent>(
  {
    _id: Schema.Types.ObjectId,

    type: { type: String, required: true, enum: ['company', 'personal'] },

    user: { type: Schema.Types.ObjectId, ref: 'crmUser', required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, required: true, default: false },
    location: { type: String, required: false },
    textColor: {
      type: String,
      required: true,
      default: '#1890FF',
      validate: {
        validator: (value: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
        message: 'Invalid color format',
      },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const EventModel: Model<IEvent> = mongoose.model<IEvent>('Event', eventSchema);

export default EventModel;

export { eventSchema};
