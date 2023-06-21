import mongoose from "mongoose";
import mongodb from "mongodb";

// Import the user schema
//import User from "../models/auth/user.model";
import serviceTranslationSchema from "../models/admin/servicesTranslations.model";

// Import logger
import logger from "../../../logs/logger";

let ServiceTranslation;

export default class ordersDAO {
  /**
   * @description Creates the connection to the MongoDB database.
   * @param {mongoose} connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(conn) {
    try {
        ServiceTranslation = await conn.model(
        "ServiceTranslation",
        serviceTranslationSchema
      );
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in servicesTranslationsDAO: ${error}`
      );
      return { error: error };
    }
  }

  /**
   * @description Fetches services by query.
   * @param {JSON} filters - Query to search for the services.
   * @param {JSON} options - Options to search for the services.
   * @param {Integer} page - Page to search for the services.
   * @param {Integer} documentsPerPage - Documents per page to search for the services.
   * @returns {Promise<JSON>} - Services information.
   */
  static async get_list(filters, options, page, documentsPerPage) {}
}
