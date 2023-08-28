// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IEventDocument } from '../interfaces';

const EventSchema: Schema<IEventDocument> = new Schema<IEventDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    owner_type: { type: String, required: true, enum: ['health_unit', 'collaborator'] },
    owner: { type: Schema.Types.ObjectId, required: true },

    order: { type: Schema.Types.ObjectId, required: false },

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

const EventModel: Model<IEventDocument> = mongoose.model<IEventDocument>('Event', EventSchema);

export { EventSchema, EventModel };
