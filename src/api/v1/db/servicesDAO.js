import mongoose from "mongoose";
import mongodb from "mongodb";

// Import the user schema
//import User from "../models/auth/user.model.js";
import serviceSchema from "../models/admin/services.model.js";

// Import logger
import logger from "../../../logs/logger.js";

let Service;
const ObjectId = mongodb.ObjectId;

export default class ordersDAO {
  /**
   * @description Creates the connection to the MongoDB database.
   * @param {mongoose} connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(conn) {
    try {
      Service = await conn.model("service", serviceSchema);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in servicesDAO: ${error}`
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
 static async get_list(filters, options, page, documentsPerPage) {
    try {
      logger.info("SERVICES-DAO GET_SERVICES_BY_QUERY STARTED: ");

      logger.info(
        "SERVICES-DAO GET_SERVICES_BY_QUERY SEARCH: " +
          JSON.stringify(
            {
              filters: filters,
              options: this.options,
              page: page,
              documentsPerPage: documentsPerPage,
            },
            null,
            2
          ) +
          "\n"
      );

      let query = {};

      if (filters) {
        if (filters.language) {
          query = { language: ObjectId(filters.language) };
        }
      }

    

      let services = await Service.find(query, options);

      // Services found
      if (services) {
        // console.log("PAGE:"+ page != null)

        if (page != null) {
          let cursor = await services;

          const totalDocuments = await cursor.count();

          const documentsPerPage = this.documentsPerPage || 10;

          const totalPages = Math.ceil(totalDocuments / documentsPerPage) - 1;

          const displayCursor = cursor
            .limit(documentsPerPage)
            .skip(documentsPerPage * page);
          const documents = await displayCursor.toArray();

          logger.info(
            "SERVICES-DAO GET_SERVICES_BY_QUERY RESULT: " +
              JSON.stringify({ documents, totalPages }, null, 2) +
              "\n"
          );

          return { documents, totalPages };
        } else {
          logger.info(
            "SERVICES-DAO GET_SERVICES_BY_QUERY RESULT: " +
              JSON.stringify(services, null, 2) +
              "\n"
          );

          return services;
        }
      }
      // User/s not found
      else {
        logger.info("SERVICES-DAO GET_SERVICES_BY_QUERY USER NOT FOUND" + "\n");
        return { error: "User not found" };
      }
    } catch (error) {
      logger.error("SERVICES-DAO GET_SERVICES_BY_QUERY ERROR: " + error + "\n");
      return { error: error };
    }
  }



}
