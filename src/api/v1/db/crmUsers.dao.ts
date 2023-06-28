import DAO from './DAO';
import { CRMUserModel } from '../models';
import { ICRMUser } from '../interfaces';

import { MONGODB_COLLECTION_CRM_USERS_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class CrmUsersDAO extends DAO<ICRMUser> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(CRMUserModel, MONGODB_COLLECTION_CRM_USERS_NS);
  }
}
