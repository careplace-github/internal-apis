import DAO from './DAO';
import { CaregiverModel } from '../models';
import { ICaregiver } from '../interfaces';

import { MONGODB_COLLECTION_CAREGIVERS_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsDAO extends DAO<ICaregiver> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(CaregiverModel, MONGODB_COLLECTION_CAREGIVERS_NS);
  }
}
