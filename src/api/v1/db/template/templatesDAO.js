// Import schema model
import templateSchema from "../../models/template/template.model.js";
// Import constants
import { MONGODB_collection_templates } from "../../../config/constants/index.js";
// Import logger
import logger from "../../../logs/logger.js";
import db_document from "../DAO.js";
import { override } from "joi";

let Template;

/**
 * Data Access Object for the `Templates` collection.
 */
export default class templates extends DAO {
  

  /**
   * Initializes the `templatesDAO` class.
   * 
   * @param {import("mongoose").db_connectionection} db_connection - MongoDB db_connectionection.
   * @param {import("mongoose").db_connectionection} deletes_db_connection - MongoDB db_connectionection.
   * @returns {Promise<void>} Returns nothing.
   * 
   */

  
  
  static async injectCollection(db_connection, deletes_db_connection) {
    super(db_connection, deletes_db_connection, MONGODB_collection_templates, templateSchema);
  };

}
