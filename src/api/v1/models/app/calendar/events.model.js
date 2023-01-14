import mongoose from "mongoose";

const Schema = mongoose.Schema;

let deleted_events;

/**
 * @see https://fullcalendar.io/docs/event-object
 */
 const eventSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    user: { type: Schema.ObjectId, ref: "user", required: true},

    series: { type: Schema.ObjectId, ref: "eventSeries", required: false },

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
    textColor: { type: String, required: true, default: "#1890FF", match: /^#[0-9A-F]{6}$/i },

    created_at: { type: Date, required: true, default: Date.now() },
    updated_at: { type: Date, required: true, default: Date.now() },
  },
  {
    timestamps: true,
    virtuals: true,
  }
);

eventSchema.virtual("type").get(function () {
  return "Event";
});




/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Event = mongoose.model("Event", eventSchema);






