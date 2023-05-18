import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  _id: Schema.Types.ObjectId,

  order: { type: Schema.ObjectId, ref: 'order', required: true },

  user: { type: Schema.ObjectId, ref: 'user', required: true },

  company: { type: Schema.ObjectId, ref: 'company', required: true },

  // Rating for the whole order
  rating: {
    type: Number,
    required: true,
    validate(value) {
      // Minimum rating is 1, maximum rating is 5
      if (value < 1 || value > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      // Increment is 0.5, eg. 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
      if (value % 0.5 !== 0) {
        throw new Error('Rating must be a multiple of 0.5');
      }
    },
  },

  comment: { type: String, required: true },
});

export default mongoose.model('review', reviewSchema);
