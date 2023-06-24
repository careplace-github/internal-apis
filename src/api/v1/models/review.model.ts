// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IReview, ICompany, IOrder } from '../interfaces';
import logger from '../../../logs/logger';

const reviewSchema: Schema<IReview> = new Schema<IReview>(
  {
    _id: Schema.Types.ObjectId,
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },

    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },

    user: { type: Schema.Types.ObjectId, ref: 'MarketplaceUser', required: true },

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

/**
 *
 */

reviewSchema.post('save', async function () {
  const review = this;

  // Type guard to ensure `review.order` is `IOrder`
  if (review.company) {
    // Fetch the related company.
    const Company = mongoose.model<ICompany>('Company');

    const company = await Company.findById(review.company);

    if (!company) {
      throw new Error('Related company not found');
    }

    // Increment the count of reviews.
    company.rating.count += 1;

    // Increment the count for the specific star rating.
    company.rating.count_stars[Math.round(review.rating)] += 1;

    // Recalculate the average rating.
    company.rating.average =
      (company.rating.average * (company.rating.count - 1) + review.rating) / company.rating.count;

    // Save the company.
    await company.save();
  }
});

const ReviewModel: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);

export default ReviewModel;

export { reviewSchema };
