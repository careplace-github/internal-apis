import DAO from "./DAO";
import Event from "../models/app/calendar/events.model";

import {MONGODB_COLLECTION_EVENTS_NS} from "../../../config/constants/index";





/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Event, MONGODB_COLLECTION_EVENTS_NS);

   

  }
}
