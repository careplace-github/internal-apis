import DAO from "./DAO.js";
import User from "../models/userLogic/users.model.js";

import { MONGODB_COLLECTION_USERS_NS } from "../../../config/constants/index.js";

/**
 * @class Class to manage the EVENTS collection.
 */
export default class UsersDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(User, MONGODB_COLLECTION_USERS_NS);
  }
}
