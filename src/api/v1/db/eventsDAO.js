import {
    MONGODB_db_active,
    MONGODB_db_deletes,
   
  } from "../../../config/constants/index.js";
  
  import mongodb from "mongodb";
  import mongoose from "mongoose";
  
  // Import the Event schema
  //import Event from "../models/auth/Event.model.js";
  import eventSchema from "../../../api/v1/models/app/calendar/events.model.js";


  // Import logger
  import logger from "../../../logs/logger.js";
  
  
  let Event;
  let events;
  const ObjectId = mongodb.ObjectId;
  
  /**
   * @class Class to manage the EVENTS collection.
   */
  export default class eventsDAO {
    /**
     * @description Creates the connection to the MongoDB database.
     * @param {mongoose} connection
     * @returns {Promise<JSON>} - MongoDB response.
     */
    static async injectCollection(conn) {
      if (events) {
        return;
      }
      try {
        Event = await conn.model("Event", eventSchema);
  
      
      } catch (error) {
        logger.error(
          `Unable to establish a collection handle in eventsDAO: ${error}`
        );
        return { error: error };
      }
    }


    static async get_list(filters, options, page, documentsPerPage) {
        try {
            logger.info("EVENTS-DAO GET_EVENTS_BY_QUERY STARTED: ");
      
            logger.info(
              "EVENTS-DAO GET_EVENTS_BY_QUERY SEARCH: " +
                JSON.stringify(
                  {
                    filters: filters,
                    options: options,
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
              if (filters.userId) {
                query = { userId: filters.userId };
              }
            }
      
            logger.info("EVENTS-DAO GET_EVENTS_BY_QUERY QUERY: " + JSON.stringify(query, null, 2) + "\n");

            // return Event.find();
      
            let events = await Event.find(query, options);

            //
            
            console.log("EVENTS:"+ events)
      
            // Event/s found
            if (events) {
              // console.log("PAGE:"+ page != null)
      
              if (page != null) {
                let cursor = await events;
      
                const totalDocuments = await cursor.count();
      
                const documentsPerPage = this.documentsPerPage || 10;
      
                const totalPages = Math.ceil(totalDocuments / documentsPerPage) - 1;
      
                const displayCursor = cursor
                  .limit(documentsPerPage)
                  .skip(documentsPerPage * page);
                const documents = await displayCursor.toArray();
      
                logger.info(
                  "EVENTS-DAO GET_EVENTS_BY_QUERY RESULT: " +
                    JSON.stringify({ documents, totalPages }, null, 2) +
                    "\n"
                );
      
                return { documents, totalPages };
              } else {
                logger.info(
                  "EVENTS-DAO GET_EVENTS_BY_QUERY RESULT: " +
                    JSON.stringify(events, null, 2) +
                    "\n"
                );
      
                return events;
              }
            }
            // Event/s not found
            else {
              logger.info("EVENTS-DAO GET_EVENTS_BY_QUERY Event NOT FOUND" + "\n");
              return { error: "Event not found" };
            }
          } catch (error) {
            logger.error("EVENTS-DAO GET_EVENTS_BY_QUERY ERROR: " + error + "\n");
            return { error: error };
          }
      }
    

}