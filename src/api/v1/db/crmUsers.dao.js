import DAO from "./DAO.js";
import CrmUser from "../models/userLogic/crmUsers.model.js";

import { MONGODB_COLLECTION_CRM_USERS_NS } from "../../../config/constants/index.js";

/**
 * @class Class to manage the EVENTS collection.
 */
export default class CrmUsersDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(CrmUser, MONGODB_COLLECTION_CRM_USERS_NS);
  }
}
