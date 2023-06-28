import DAO from './DAO';
import { EventModel } from '../models';
import { IEvent } from '../interfaces';

import { MONGODB_COLLECTION_EVENTS_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsDAO extends DAO<IEvent> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(EventModel, MONGODB_COLLECTION_EVENTS_NS);
  }
}
