// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IHealthUnitReviewModel } from '../interfaces';
import logger from '../../../logs/logger';

const HealthUnitReviewSchema: Schema<IHealthUnitReviewModel> = new Schema<IHealthUnitReviewModel>(
  {
    _id: Schema.Types.ObjectId,

    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: true },

    customer: { type: Schema.Types.ObjectId, ref: 'customer', required: true },

    rating: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => {
          if (value < 1 || value > 5) {
            throw new Error('Rating must be between 1 and 5');
          }
          if (value % 0.5 !== 0) {
            throw new Error('Rating must be a multiple of 0.5');
          }
          return true;
        },
      },
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const HealthUnitReviewModel: Model<IHealthUnitReviewModel> = mongoose.model<IHealthUnitReviewModel>(
  'HealthUnitReview',
  HealthUnitReviewSchema
);

export { HealthUnitReviewSchema, HealthUnitReviewModel };
