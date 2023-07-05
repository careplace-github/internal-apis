// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IEventModel } from '../interfaces';

const EventSchema: Schema<IEventModel> = new Schema<IEventModel>(
  {
    _id: Schema.Types.ObjectId,

    ownerType: { type: String, required: true, enum: ['health_unit', 'collaborator'] },
    owner: { type: Schema.Types.ObjectId, required: true },

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

const EventModel: Model<IEventModel> = mongoose.model<IEventModel>('Event', EventSchema);

export { EventSchema, EventModel };
