// Import Data Access Objects
import EventsDAO from "../db/events.dao.js";
import UsersDAO from "../db/users.dao.js";
import eventsSeriesDAO from "../db/eventsSeries.dao.js";
// Import Utils
import requestUtils from "../utils/request.utils.js";
import errorUtils from "../utils/error.utils.js";
// Import logger
import logger from "../../../logs/logger.js";

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

  static async create_event(req, res, next) {
    try {
      let request = requestUtils(req);

      logger.info(
        `Calendar Controller CREATE Request: ${JSON.stringify(
          request,
          null,
          2
        )}\n`
      );

      let response;
      let event = req.body;
      let eventsDAO = new EventsDAO();
      let usersDAO = new UsersDAO();

      /**
       *   try {
        let userExists = usersDAO.get_one(event.userId);
      } catch (err) {
        response.statusCode = 404;
        response.message =
          "User not found. Unable to create event without a user.";

        let error = {
          code: err.code,
          message: err.message,
        };

        logger.error(
          `Calendar Controller CREATE Response: ${JSON.stringify(
            error,
            null,
            2
          )}\n`
        );

        res.status(404).json(error);
      }
       */

      try {
        let eventAdded = await eventsDAO.add(event);
        res.status(201).json(eventAdded);
      } catch (err) {
        let error = {
          code: err.code,
          message: err.message,
        };

        switch (err.code) {
          case invalid_request:
            response.statusCode = 400;

            response.message = "Invalid request.";
            break;
        }

        logger.error(
          `Calendar Controller CREATE Response: ${JSON.stringify(
            error,
            null,
            2
          )}\n`
        );

        res.status(error.code).json(error);
      }
    } catch (error) {}
  }

  static async show_event(req, res, next) {}

  static async update_event(req, res, next) {}

  static async destroy_event(req, res, next) {
    let response;

    let event_id = req.params.id;
    let eventsDAO = new EventsDAO();

    try {
      let deletedDocument = await eventsDAO.delete(event_id);

      logger.info(
        `Calendar Controller DESTROY Response: \n ${JSON.stringify(
          deletedDocument,
          null,
          2
        )}\n`
      );

      response.statusCode = 200;
      response.data = deletedDocument;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async index_eventsSeries(req, res, next) {}

  static async create_eventsSeries(req, res, next) {}

  static async show_eventsSeries(req, res, next) {}

  static async update_eventsSeries(req, res, next) {}

  static async destroy_eventsSeries(req, res, next) {}
}
