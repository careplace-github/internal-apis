// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IAdDocument } from '../interfaces';

const AdSchema: Schema<IAdDocument> = new Schema<IAdDocument>(
  {
    _id: Types.ObjectId,

    type: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: true},
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const AdModel: Model<IAdDocument> = mongoose.model<IAdDocument>(
  'Ad',
  AdSchema
);

export { AdSchema, AdModel };
