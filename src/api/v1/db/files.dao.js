import mongoose from "mongoose";

import fileSchema from "../models/utils/files.model.js";

import logger from "../../../logs/logger.js";

let File;

/**
 * @class Class to manage the files collection.
 */
export default class usersDAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connectionection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(db_connection, deletes_db_connection) {
    try {
      File = await db_connection.model("file", fileSchema);
      File.injectCollection(deletes_db_connection);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in filesDAO: ${error}`
      );
      return { error: error };
    }
  }

  static async get_list(filters, options, page, documentsPerPage) {
    try {
      logger.info("FILES-DAO GET_FILES_BY_QUERY STARTED: ");

      logger.info(
        "FILES-DAO GET_FILES_BY_QUERY SEARCH: " +
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

      let files = await File.find(query, options);

      logger.info(
        "FILES-DAO GET_FILES_BY_QUERY RESULT: " +
          JSON.stringify(files, null, 2) +
          "\n"
      );

      return files;
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in filesDAO: ${error}`
      );
      return { error: error };
    }
  }
}
