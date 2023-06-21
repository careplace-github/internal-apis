import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let Caregiver;

const caregiverSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    birthdate: { type: Date, required: true },

    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },

    company: { type: Schema.ObjectId, ref: 'Company', required: true },

    services: [{ type: Schema.ObjectId, ref: 'Service', required: false }],

    address: {
      street: { type: String, required: false },

      postal_code: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: {
        type: String,
        required: false,
      },

      coordinates: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
      },
    },

    role: {
      type: String,
      required: true,
      enum: ['caregiver'],
    },

    profile_picture: { type: String, required: false },
  },
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

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Caregiver = mongoose.model('Caregiver', caregiverSchema);
