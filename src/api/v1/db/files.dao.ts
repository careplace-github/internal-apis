import DAO from './DAO';
import { FileModel } from '../models';
import { IFile } from '../interfaces';

import { MONGODB_COLLECTION_FILES_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsSeriesDAO extends DAO<IFile> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    console.log(`Creating a new instance of the EventsSeriesDAO ${MONGODB_COLLECTION_FILES_NS}`);
    super(FileModel, MONGODB_COLLECTION_FILES_NS);
  }
}
