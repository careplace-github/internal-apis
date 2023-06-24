import DAO from './DAO';
import { MarketplaceUserModel } from '../models';
import { IMarketplaceUser } from '../interfaces';

import { MONGODB_COLLECTION_MARKETPLACE_USERS_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class MarketplaceUsersDAO extends DAO<IMarketplaceUser> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(MarketplaceUserModel, MONGODB_COLLECTION_MARKETPLACE_USERS_NS);
  }
}
