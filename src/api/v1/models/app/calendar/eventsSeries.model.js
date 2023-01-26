import mongoose from "mongoose";
import dateUtils from "../../../utils/data/date.utils.js";

const Schema = mongoose.Schema;

let EventSeries;

const eventSeriesSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    user: { type: Schema.ObjectId, ref: "crm_users", required: true },

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
        start: { type: String, required: true },
        end: { type: String, required: true },
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
        enum: [0, 1, 2],
        default: 0,
      },
      end_date: { type: Date, required: false },
      end_occurrences: { type: Number, required: false },
    },




    title: { type: String, required: true },
    description: { type: String, required: false },
    location: { type: String, required: false },

    textColor: { type: String, required: false },
    


  },

  {
    timestamps: true,
  }
);

/**
 * Returns a list of Events based on this EventSeries
 */
eventSeriesSchema.methods.createEvents = async function () {
  let DateUtils = new dateUtils();
  let events = [];

  /**
   * EventSeries example:
   * 
   * {
	"user": "63a20525a727ba8150d348c9",
	"title": "",
	"descriptiom": "",
	"location": "",
	"recurrency_type": 1,
	"schedule": [
		{
			"start": "2023-01-17T08:00:00.000Z",
			"end": "2023-01-17T09:00:00.000Z"
		},
		{
			"start": "2023-01-19T10:00:00.000Z",
			"end": "2023-01-19T12:30:00.000Z"
		},
		{
			"start": "2023-01-21T17:00:00.000Z",
			"end": "2023-01-21T20:00:00.000Z"
		}
	],
	"end_series": {
		"ending_type": 2,
		"occurencies": 6
	}
}
   */

  switch (this.ending_type) {
    /**
     * 0 - Events Series Never Ends
     * Create events until 5 years from now
     *
     * @example
     * "user": "63a20525a727ba8150d348c9",
     * "title": "",
     * "descriptiom": "",
     * "location": "",
     * "recurrency_type": 1,
     * "schedule": [
     * {
     * "start": "2023-01-17T08:00:00.000Z",
     * "end": "2023-01-17T09:00:00.000Z"
     * },
     * {
     * "start": "2023-01-19T10:00:00.000Z",
     * "end": "2023-01-19T12:30:00.000Z"
     * },
     * {
     * "start": "2023-01-21T17:00:00.000Z",
     * "end": "2023-01-21T20:00:00.000Z"
     * }
     * ],
     * "end_series": {
     * "ending_type": 0,
     * }
     * }
     *
     * Based on the event above the function will create events until 5 years from now.
     * If the event is weekly, then it will create events every week until 5 years from now.
     * If the event is bi-weekly, then it will create events every 2 weeks until 5 years from now.
     *  If the event is monthly, then it will create events every month until 5 years from now.
     */
    case 0:
      let date = new Date();
      let fiveYearsFromNow = date.setFullYear(date.getFullYear() + 5);

      this.schedule.forEach((event) => {
        let startDate = event.start;
        let endDate = event.end;

        while (endDate < fiveYearsFromNow) {
          let event = {
            user: this.user,
            title: this.title,
            description: this.description,
            location: this.location,
            start: startDate,
            end: endDate,
          };

          events.push(event);

          startDate = DateUtils.getNextRecurrentDate(
            startDate,
            this.recurrency_type
          );
          endDate = DateUtils.getNextRecurrentDate(
            endDate,
            this.recurrency_type
          );
        }
      });

      return events;

    /**
     * 1 - Events Series Ends on a Specific Date
     * Create events until the ending_type.end_date
     *
     *  @example
     * "user": "63a20525a727ba8150d348c9",
     * "title": "",
     * "descriptiom": "",
     * "location": "",
     * "recurrency_type": 1,
     * "schedule": [
     * {
     * "start": "2023-01-17T08:00:00.000Z",
     * "end": "2023-01-17T09:00:00.000Z"
     * },
     * {
     * "start": "2023-01-19T10:00:00.000Z",
     * "end": "2023-01-19T12:30:00.000Z"
     * },
     * {
     * "start": "2023-01-21T17:00:00.000Z",
     * "end": "2023-01-21T20:00:00.000Z"
     * }
     * ],
     * "end_series": {
     * "ending_type": 1,
     * "end_date": "2023-02-21T20:00:00.000Z"
     * }
     * }
     *
     * Based on the event above the function will create events until the end_date.
     * If the event is weekly, then it will create events every week until the end_date.
     * If the event is bi-weekly, then it will create events every 2 weeks until the end_date.
     * If the event is monthly, then it will create events every month until the end_date.
     */
    case 1:
      this.schedule.forEach((event) => {
        let startDate = event.start;
        let endDate = event.end;

        while (endDate < this.end_series.end_date) {
          let event = {
            user: this.user,
            title: this.title,
            description: this.description,
            location: this.location,
            start: startDate,
            end: endDate,
          };

          events.push(event);

          startDate = DateUtils.getNextRecurrentDate(
            startDate,
            this.recurrency_type
          );

          endDate = DateUtils.getNextRecurrentDate(
            endDate,
            this.recurrency_type
          );
        }
      });

      return events;

    /**
     * 2 - Events Series Ends after a Number of Occurrences
     * Create events until the ending_type.end_occurrences. If the occurence is, for example, 10, then each event will be created 10 times (accordingly with it's recurrency).
     *
     *
     *       @example
     * "user": "63a20525a727ba8150d348c9",
     * "title": "",
     * "descriptiom": "",
     * "location": "",
     * "recurrency_type": 1,
     * "schedule": [
     * {
     * "start": "2023-01-17T08:00:00.000Z",
     * "end": "2023-01-17T09:00:00.000Z"
     * },
     * {
     * "start": "2023-01-19T10:00:00.000Z",
     * "end": "2023-01-19T12:30:00.000Z"
     * },
     * {
     * "start": "2023-01-21T17:00:00.000Z",
     * "end": "2023-01-21T20:00:00.000Z"
     * }
     * ],
     * "end_series": {
     * "ending_type": 2,
     * "occurencies": 8,
     * }
     * }
     *
     * Based on the event above the function will create events until the occurencies. In this case, 8 occurencies * 3 events = 24 events.
     * If the event is weekly, then it will create events every week until the occurencies.
     * If the event is bi-weekly, then it will create events every 2 weeks until the occurencies.
     * If the event is monthly, then it will create events every month until the occurencies.
     */
    case 2:
      this.schedule.forEach((event) => {
        let startDate = event.start;
        let endDate = event.end;

        for (let i = 0; i < this.end_series.occurencies; i++) {
          let event = {
            user: this.user,
            title: this.title,
            description: this.description,
            location: this.location,
            start: startDate,
            end: endDate,
          };

          events.push(event);

          startDate = DateUtils.getNextRecurrentDate(
            startDate,
            this.recurrency_type
          );

          endDate = DateUtils.getNextRecurrentDate(
            endDate,
            this.recurrency_type
          );
        }
      });

      return events;
  }
};

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default EventSeries = mongoose.model("events_series", eventSeriesSchema);
