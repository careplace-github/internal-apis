// Import schema model
import templateSchema from "../../models/template/template.model.js";
// Import constants
import { MONGODB_collection_templates } from "../../../config/constants/index.js";
// Import logger
import logger from "../../../logs/logger.js";

let Template;

/**
 * Data Access Object for the `Templates` collection.
 */
export default class templatesDAO {
  /**
   * Injects the `Template` collection into the `templatesDAO` class.
   *
   * @param {import("mongoose").Connection} conn - MongoDB connection.
   * @returns {Promise<void>} Returns nothing.
   *
   * @throws {Error} Throws an Error if there is an error with the connection.
   */
  static async injectCollection(conn) {
    try {

      if(Template) return;

      Template = await conn.model("template", templateSchema);

      logger.info(`Connected to collection: ${Template.collection.name}`);

      return;
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in templatesDAO: ${error}`
      );
    }
  }

  /**
   * Gets a list of the Templates from the `Template` collection.
   *
   * @param {JSON} filters - Filters to apply to the query.
   * @param {JSON} options - Options to apply to the query.
   * @param {Number} page - Page number to get.
   * @param {Number} documentsPerPage - Number of documents per page.
   * @returns {Promise<Array<JSON>>} Returns an array of JSON objects with the `Templates`. If no `Templates` are found, returns an empty array.
   *
   * @throws {Error} Throws an Error if the `Template` collection is not injected.
   * @throws {Error} Throws an Error if there is an error with the query.
   * @throws {NotFoundError} Throws a NotFoundError if there are no `Templates` found.
   * @throws {RangeError} Throws a RangeError if the `page` is less than 1 or greater than the number of pages.
   * @throws {RangeError} Throws a RangeError if the `documentsPerPage` is less than 1 or greater than the number of documents.
   */
  static async get_list(filters, options, page, documentsPerPage) {}

  static async add(template) {}

  static async get_one(templateId) {}

  static async set(template) {}

  static async delete(templateId) {}
}
