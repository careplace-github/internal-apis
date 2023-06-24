import DAO from './DAO';
import { EventSeriesModel } from '../models';
import { IEventSeries } from '../interfaces';
import { MONGODB_COLLECTION_EVENTS_SERIES_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsSeriesDAO extends DAO<IEventSeries> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    console.log(
      `Creating a new instance of the EventsSeriesDAO ${MONGODB_COLLECTION_EVENTS_SERIES_NS}`
    );
    super(EventSeriesModel, MONGODB_COLLECTION_EVENTS_SERIES_NS);
  }
}
