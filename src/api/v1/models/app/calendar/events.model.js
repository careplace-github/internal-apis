import mongoose from 'mongoose';
import * as Schemas from '../../../models/index.js';
import * as Error from '../../../utils/errors/http/index.js';

let Event;

const Schema = mongoose.Schema;

/**
 * @see https://fullcalendar.io/docs/event-object
 */
const eventSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    user: { type: Schema.ObjectId, ref: 'user', required: true },

    company: { type: Schema.ObjectId, ref: 'company', required: false },

    series: { type: Schema.ObjectId, ref: 'eventSeries', required: false },

    type: { type: String, required: true, default: 'personal', enum: ['personal'] },

    // Validate if the title is a string and if it is not empty.
    title: { type: String, required: true },
    description: { type: String, required: false },

    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, required: true, default: false },

    location: { type: String, required: false },

    /**
     * @todo Change default color
     * Add a validation that checks if the color is a valid hex color code (e.g. #1890FF) if not use the default color
     */
    textColor: {
      type: String,
      required: true,
      default: '#1890FF',
      
    },
  },
  {
    timestamps: true,
    virtuals: true,
  }
);

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Event = mongoose.model('Event', eventSchema);
