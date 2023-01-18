import DAO from "./DAO.js";
import EventSeries from "../models/app/calendar/eventsSeries.model.js";

import { MONGODB_COLLECTION_EVENTS_SERIES_NS } from "../../../config/constants/index.js";

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsSeriesDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(EventSeries, MONGODB_COLLECTION_EVENTS_SERIES_NS);
  }
}
