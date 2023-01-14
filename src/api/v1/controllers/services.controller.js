// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";

import servicesDAO from "../db/services.dao.js";

export default class ServicesController {
  static async index(req, res, next) {
    //try {
      var request = requestUtils(req);
      let response;

      let filters = {};
      let options = {};
      let page = req.query.page != null ? req.query.page : null;

      logger.info(
        "Services Controller INDEX: " + JSON.stringify(request, null, 2) + "\n"
      );

      // Check which language the user wants to use.
      if (req.query.language) {
        let language = req.query.language;
        filters.language = language
      } 
      else {
         // If the language query is null or empty, then we will use the default language.
        //filters.language = "pt";
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
        "Attempting to get users from MongoDB: " +
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

      const services = await servicesDAO.get_list(filters, options, page);

      // If there is an error, then we will return the error.
      if (services.error != null) {
        request.statusCode = 400;
        request.response = { error: services.error.message };

        logger.error(
          "Error fetching services from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).json({ error: services.error.message });
      }

      request.statusCode = 200;
      request.response = services;

      return res.status(200).json(services);



      /**
       *  } catch (error) {
      // If there is an internal error, then we will return the error.
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json({ error: error });
    }
       */

   
  }
}
