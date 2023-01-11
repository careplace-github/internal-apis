import {
    MONGODB_db_active,
    MONGODB_db_deletes,
    MONGODB_collection_users,
  } from "../../../config/constants/index.js";
  
  import mongodb from "mongodb";
  import mongoose from "mongoose";
  
  // Import the user schema
  //import User from "../models/auth/user.model.js";
  import eventsSeriesSchema from "../../../api/v1/models/app/calendar/eventsSeries.model.js";


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
     * @description Creates the connection to the MongoDB database.
     * @param {mongoose} connection
     * @returns {Promise<JSON>} - MongoDB response.
     */
    static async injectCollection(conn) {
      if (eventsSeries) {
        return;
      }
      try {
        EventSeries = await conn.model("EventSeries", eventsSeriesSchema);
  
        // users = await conn.collection(MONGODB_collection_users);
        // User = mongoose.model("User", userSchema);
        // await connection.model("users", User);
      } catch (error) {
        logger.error(
          `Unable to establish a collection handle in eventsSeriesDAO: ${error}`
        );
        return { error: error };
      }
    }
}