import DAO from "./DAO.js";
import Relative from "../models/userLogic/relatives.model.js";

import { MONGODB_collection_relatives } from "../../../config/constants/index.js";

/**
 * @class Class to manage the EVENTS collection.
 */
export default class RelativesDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Relative, MONGODB_collection_relatives);
  }
}
