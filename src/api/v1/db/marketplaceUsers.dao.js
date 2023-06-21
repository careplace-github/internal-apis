import DAO from "./DAO";
import MarketplaceUser from "../models/userLogic/marketplaceUsers.model";

import { MONGODB_COLLECTION_MARKETPLACE_USERS_NS } from "../../../config/constants/index";

/**
 * @class Class to manage the EVENTS collection.
 */
export default class MarketplaceUsersDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(MarketplaceUser, MONGODB_COLLECTION_MARKETPLACE_USERS_NS);
  }
}
