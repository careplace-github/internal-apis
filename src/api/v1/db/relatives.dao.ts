import DAO from './DAO';
import { RelativeModel } from '../models';
import { IRelative } from '../interfaces';

import { MONGODB_COLLECTION_RELATIVES_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class RelativesDAO extends DAO<IRelative> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(RelativeModel, MONGODB_COLLECTION_RELATIVES_NS);
  }
}
