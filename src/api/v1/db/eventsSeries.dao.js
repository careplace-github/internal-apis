import {
    MONGODB_db_active,
    MONGODB_db_deletes,
    MONGODB_collection_users,
  } from "../../../config/constants/index.js";
  
  import mongodb from "mongodb";
  import mongoose from "mongoose";
  
  // Import the user schema
  //import User from "../models/auth/user.model.js";
  import eventsSeriesSchema from "../models/app/calendar/eventsSeries.model.js";


  // Import logger
  import logger from "../../../logs/logger.js";
  
  
  let EventSeries;
  let eventsSeries;
  const ObjectId = mongodb.ObjectId;
  
  /**
   * @class Class to manage the users collection.
   */
  export default class eventsSeriesDAO {
    /**
     * @description Creates the db_connectionection to the MongoDB database.
     * @param {mongoose} db_connectionection
     * @returns {Promise<JSON>} - MongoDB response.
     */
    static async injectCollection(db_connection, deletes_db_connection) {
      if (eventsSeries) {
        return;
      }
      try {
        EventSeries = await db_connection.model("EventSeries", eventsSeriesSchema);
        EventSeries.injectCollection(deletes_db_connection);
  
        // users = await db_connection.collection(MONGODB_collection_users);
        // User = mongoose.model("User", userSchema);
        // await db_connectionection.model("users", User);
      } catch (error) {
        logger.error(
          `Unable to establish a collection handle in eventsSeriesDAO: ${error}`
        );
        return { error: error };
      }
    }
}