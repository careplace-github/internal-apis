import mongoose from "mongoose";

import caregiverSchema from "../models/userLogic/caregivers.model.js";
import MONGODB_collection_caregivers from "../../../config/constants/index.js";

import logger from "../../../logs/logger.js";

export const settings = {
  schema: caregiverSchema,
  collection: MONGODB_collection_caregivers,
};




/**
 * @class Class to manage the Ccregivers collection.
 */
export default class usersDAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connectionection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(db_connection, deletes_db_connection) {
    try {
      Caregiver = await db_connection.model("Caregiver", caregiverSchema);
      Caregiver.injectCollection(deletes_db_connection);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in CaregiversDAO: ${error}`
      );
      return { error: error };
    }
  }

  static async get_list(filters, options, page, documentsPerPage) {
    try {
      logger.info("CaregiverS-DAO GET_CaregiverS_BY_QUERY STARTED: ");

      logger.info(
        "CaregiverS-DAO GET_CaregiverS_BY_QUERY SEARCH: " +
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

      let caregivers = await Caregiver.find(query, options);

      logger.info(
        "CaregiverS-DAO GET_CaregiverS_BY_QUERY RESULT: " +
          JSON.stringify(caregivers, null, 2) +
          "\n"
      );

      return caregivers;
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in caregiversDAO: ${error}`
      );
      return { error: error };
    }
  }
}
