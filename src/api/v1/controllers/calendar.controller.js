import eventsDAO from "../db/eventsDAO.js";
import eventsSeriesDAO from "../db/eventsSeriesDAO.js";
// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";



/**
 * Calendar Controller
 * @class CalendarController
 * @description Controller for the Calendar. Creates events and series of events based on the data provided from the orders.
 * @exports CalendarController
 * @version 1.0.0
 * @namespace CalendarController
 * @example 
 *  import CalendarController from "./api/v1/controllers/calendar.controller.js";
 *  const calendarController = new CalendarController();
 *  calendarController.index_events(req, res, next); 
 *  calendarController.create_event(req, res, next); 
 *  
 */
export default class CalendarController {

    static async index_events(req, res, next) {
        try {
         
            
            var request = requestUtils(req);

            let filters = {};
            let options = {};
            let page = req.query.page != null ? req.query.page : null;
            let mongodbResponse;
      
            logger.info(
              "Events Controller INDEX: " + JSON.stringify(request, null, 2) + "\n"
            );
      
            // If the companyId query parameter is not null, then we will filter the results by the companyId query parameter.
            if (req.query.userId) {
              filters.userId = req.query.userId;
            }
      
            // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
            if (req.query.sortBy) {
              // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
              // Otherwise, we will by default sort the results by ascending order.
              options.sort = {
                [req.query.sortBy]: req.query.sortOrder == "desc" ? -1 : 1, // 1 = ascending, -1 = descending
              };
            }
      
            logger.info(
              "Attempting to get Events from MongoDB: " +
                JSON.stringify(
                  {
                    filters: filters,
                    options: options,
                    page: page,
                  },
                  null,
                  2
                ) +
                "\n"
            );


            const events = await eventsDAO.get_list(filters, options, page);

           
            

      


         
         







        

          res.status(200).json(events);
        } catch (error) {
          next(error);
        }
      }

      static async create_event(req, res, next) {}

      static async show_event(req, res, next) {}

        static async update_event(req, res, next) {}

        static async destroy_event(req, res, next) {}



        static async index_eventsSeries(req, res, next) {}

        static async create_eventsSeries(req, res, next) {}

        static async show_eventsSeries(req, res, next) {}

        static async update_eventsSeries(req, res, next) {}

        static async destroy_eventsSeries(req, res, next) {}


    


}