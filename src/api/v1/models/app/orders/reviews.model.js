import { validate } from "express-validation";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  _id: Schema.Types.ObjectId,

  company: { type: Schema.ObjectId, ref: "company", required: true },

  caregiver: { type: Schema.ObjectId, ref: "user", required: true },

  client: { type: Schema.ObjectId, ref: "user", required: true },

  order: { type: Schema.ObjectId, ref: "order", required: true },

  // Rating for the whole order
  general_rating: {
    type: Number,
    required: true,
    validate(value) {
      // Minimum rating is 1, maximum rating is 5
      if (value < 1 || value > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      // Increment is 0.5, eg. 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
      if (value % 0.5 !== 0) {
        throw new Error("Rating must be a multiple of 0.5");
      }
    },
  },

  // Rating for each service in the order
  services_rating: [
    {
      service: { type: Schema.ObjectId, ref: "service", required: true },
      rating: {
        type: Number,
        required: true,
        validate(value) {
          if (value < 1 || value > 5) {
            throw new Error("Rating must be between 1 and 5");
          }
          if (value % 0.5 !== 0) {
            throw new Error("Rating must be a multiple of 0.5");
          }
        },
      },
    },
  ],

  comment: { type: String, required: false },

  created_at: { type: Date, required: true, default: Date.now() },

  updated_at: { type: Date, required: true, default: Date.now() },
});

// Methods
reviewSchema.methods.getServices = function () {
  return this.order.services;
};

reviewsSchema.methods.getGeneralRating = function () {
  let rating = 0;
  this.servicesRating.forEach((service) => {
    rating += service.rating;
  });
  return rating / this.servicesRating.length;
};

export default mongoose.model("review", reviewSchema);
