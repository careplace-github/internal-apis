import DAO from "./DAO";
import Relative from "../models/userLogic/relatives.model";

import { MONGODB_COLLECTION_RELATIVES_NS } from "../../../config/constants/index";

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
    super(Relative, MONGODB_COLLECTION_RELATIVES_NS);
  }
}
