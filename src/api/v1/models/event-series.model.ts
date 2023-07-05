// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IEventSeriesModel } from '../interfaces';

const EventSeriesSchema: Schema<IEventSeriesModel> = new Schema<IEventSeriesModel>(
  {
    _id: Schema.Types.ObjectId,

    ownerType: { type: String, required: true, enum: ['company', 'collaborator'] },
    owner: { type: Schema.Types.ObjectId, required: true },

    // If ownerType is company
    order: { type: Schema.Types.ObjectId, ref: 'orders', required: false },

    start_date: { type: Date, required: true },
    recurrency: { type: Number, required: true, enum: [1, 2, 4] },
    schedule: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
      },
    ],
    end_series: {
      ending_type: {
        type: Number,
        required: true,
        enum: [0, 1, 2],
        default: 0,
      },
      end_date: { type: Date, required: false },
      end_occurrences: { type: Number, required: false },
    },
    title: { type: String, required: true },
    description: { type: String, required: false, default: '' },
    location: { type: String, required: false },
    allDay: { type: Boolean, required: true, default: false },
    textColor: { type: String, required: true, default: '#1890FF' },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const EventSeriesModel: Model<IEventSeriesModel> = mongoose.model<IEventSeriesModel>(
  'EventSeries',
  EventSeriesSchema
);

export { EventSeriesSchema, EventSeriesModel };
