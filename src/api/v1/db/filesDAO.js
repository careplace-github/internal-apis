import mongoose from "mongoose";

import fileSchema from "../models/admin/files.model.js";

import logger from "../../../logs/logger.js";

let File;



/**
 * @class Class to manage the files collection.
 */
 export default class usersDAO {
    /**
     * @description Creates the connection to the MongoDB database.
     * @param {mongoose} connection
     * @returns {Promise<JSON>} - MongoDB response.
     */
    static async injectCollection(conn) {
     
      try {
         User = await conn.model("user", userSchema);
    
  
        
      } catch (error) {
        logger.error(
          `Unable to establish a collection handle in filesDAO: ${error}`
        );
        return { error: error };
      }
    }

    
}