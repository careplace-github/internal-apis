import mongoose from "mongoose";

const Schema = mongoose.Schema;

const caregiverSchema = new Schema({
  _id: Schema.Types.ObjectId,

  user: { type: Schema.ObjectId, ref: "User", required: true },

  services: [{ type: Schema.ObjectId, ref: "Service", required: false }],

  schedule: [{ type: Schema.ObjectId, ref: "Event", required: false }],

  rating: { type: Number, required: false },

  reviews: [{ type: Schema.ObjectId, ref: "Review", required: false }],


  created_at: { type: Date, required: true, default: Date.now() },

    updated_at: { type: Date, required: true, default: Date.now() },

}
,
{

  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true },
}

);

// methods

caregiverSchema.methods.getRating = function () {
  let rating = 0;

  this.reviews.forEach((review) => {
    rating += review.rating;
  });

  return rating / this.reviews.length;
};

/**
 * Given a list of events, check if the caregiver is available by checking if the caregiver has any event that overlaps with the events passed as parameter. The caregiver events are stored in the schedule property (Array). The events passed as parameter are the events that the caregiver is trying to schedule. If the caregiver has any event that overlaps with the events passed as parameter, the caregiver is not available. If the caregiver has no events that overlaps with the events passed as parameter, the caregiver is available.
 */
caregiverSchema.methods.isAvailable = function (events) {
  let available = true;

  this.schedule.forEach((event) => {
    events.forEach((eventToSchedule) => {
      if (eventToSchedule.overlaps(event)) {
        available = false;
      }
    });
  });

  return available;
};

export default caregiverSchema;
