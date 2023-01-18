import mongoose from "mongoose";
import * as Schemas from "../../../models/index.js";
import * as Error from "../../../helpers/errors/errors.helper.js";



const Schema = mongoose.Schema;

/**
 * @see https://fullcalendar.io/docs/event-object
 */
const eventSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    user: { type: Schema.ObjectId, ref: "user", required: true },

    series: { type: Schema.ObjectId, ref: "eventSeries", required: false },

    // Validate if the title is a string and if it is not empty.
    title: { type: String, required: true },
    description: { type: String, required: false },
    allDay: { type: Boolean, required: true, default: false },
    start: { type: Date, required: true },
    end: { type: Date, required: true },

    location: { type: String, required: false },

    /**
     * @todo Change default color
     * Add a validation that checks if the color is a valid hex color code (e.g. #1890FF) if not use the default color
     */
    textColor: {
      type: String,
      required: true,
      default: "#1890FF",
      match: /^#[0-9A-F]{6}$/i,
    },
  },
  {
    timestamps: true,
    virtuals: true,
  }
);

eventSchema.virtual("type").get(function () {
  return "Event";
});

eventSchema.virtual("verifyModel").get(function () {
  // Get the current date.
  const currentDate = new Date();

  // Change the updated_at field to current date.
  this.updatedAt = currentDate;

  // Check if the required fields are not empty.
  if (!this.title) {
    throw new Error._400(`The title of the ${this.type} cannot be empty.`);
  }

  if (!this.start) {
    throw new Error._400(`The start date of the ${this.type} cannot be empty.`);
  }

  if (!this.end) {
    throw new Error._400(`The end date of the ${this.type} cannot be empty.`);
  }

  // Check if the start date is before the end date
  if (this.start > this.end) {
    throw new Error._400(
      `The start date cannot be after the end date. 'start': ${this.start} 'end': ${this.end}`
    );
  }
});

// Pre-save and Pre-FindByIdAndUpdate Hook
eventSchema.pre("save", function (next) {
  this.verifyModel;

  // Call the next function in the pre-save chain.
  next();
});

eventSchema.pre("findByIdAndUpdate", function (next) {
  this.verifyModel;

  // Call the next function in the pre-save chain.
  next();
});

eventSchema.pre("findOneAndUpdate", function (next) {
  this.verifyModel;

  // Call the next function in the pre-save chain.
  next();
});

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Event = mongoose.model("Event", eventSchema);

