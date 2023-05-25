import mongoose from 'mongoose';
import dateUtils from '../../../utils/data/date.utils.js';

const Schema = mongoose.Schema;

let EventSeries;

const eventSeriesSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    user: { type: Schema.ObjectId, ref: 'crm_users', required: true, default: null },

    company: { type: Schema.ObjectId, ref: 'companies', required: true, default: null },

    order: { type: Schema.ObjectId, ref: 'orders', required: true, default: null },

    start_date: { type: Date, required: true },
    /**
     * Recurrency type
     * 1 - Weekly - Every week
     * 2 - Bi-weekly - Every 2 weeks
     * 4 - Monthly - Every 4 weeks
     */
    recurrency_type: { type: Number, required: true, enum: [1, 2, 4] },

    // If isRecurrent is true, this is the frequency of the order
    // If isRecurrent is false, this is the date of the order
    schedule: [
      {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
      },
    ],

    end_series: {
      /**
       * Ending type of the series
       * 0 - Never end
       * 1 - End on a specific date
       * 2 - End after a number of occurrences
       */
      ending_type: {
        type: Number,
        required: true,
        enum: [0, 1],
        default: 0,
      },
      end_date: { type: Date, required: false },
      end_occurrences: { type: Number, required: false },
    },

    title: { type: String, required: true },
    description: { type: String, required: true, default: '' },
    location: { type: String, required: false },
    allDay: { type: Boolean, required: true, default: false },
    textColor: { type: String, required: true, default: '#1890FF' },
  },

  {
    timestamps: true,
  }
);

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default EventSeries = mongoose.model('events_series', eventSeriesSchema);
