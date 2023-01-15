// Import Data Access Objects
import EventsDAO from "../db/events.dao.js";
import UsersDAO from "../db/users.dao.js";
import eventsSeriesDAO from "../db/eventsSeries.dao.js";
// Import Utils
import requestUtils from "../utils/request.utils.js";
import errorUtils from "../utils/error.utils.js";
// Import logger
import logger from "../../../logs/logger.js";
import * as Error from "../middlewares/errors/index.js";
import AuthHelper from "../helpers/auth.helper.js";

export default class CalendarController {
  static async index_events(req, res, next) {
    try {
      let response = {};

      if (req.headers.authorization) {
        // Extract the token from the request header
        let token = req.headers.authorization.split(" ")[1];

        let authId = await AuthHelper.getAuthId(token, "cognito");

        let usersDAO = new UsersDAO();

        // Get user that cognitoId matches the authId
        var user = await usersDAO.get_list({ cognito_id: { $eq: authId } });
      } else {
        throw new Error._401("No token provided.");
      }

      let filters = {
        user: { $eq: user._id },
      };
      let options = {};
      let page = req.query.page != null ? req.query.page : null;
      let documentsPerPage =
        req.query.documentsPerPage != null ? req.query.documentsPerPage : null;
      let populate = req.query.populate != null ? req.query.populate : null;

      let eventsDAO = new EventsDAO();

      // If the companyId query parameter is not null, then we will filter the results by the companyId query parameter.
      if (req.query.userId) {
        //filters.userId = req.query.userId;
      }

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy) {
        // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
        // Otherwise, we will by default sort the results by ascending order.
        options.sort = {
          [req.query.sortBy]: req.query.sortOrder == "desc" ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }

      const events = await eventsDAO.get_list(
        filters,
        options,
        page,
        documentsPerPage,
        populate
      );

      response.statusCode = 200;
      response.data = events;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async create_event(req, res, next) {
    try {
      let response = {};

      let event = req.body;
      let eventsDAO = new EventsDAO();
      let usersDAO = new UsersDAO();

      try {
        let userExists = await usersDAO.get_one(event.user);
      } catch (err) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "User does not exist. Need a valid User to create an event."
          );
        }
      }

      let eventAdded = await eventsDAO.add(event);

      response.statusCode = 201;
      response.data = eventAdded;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async show_event(req, res, next) {
    let response = {};

    let event_id = req.params.id;
    let eventsDAO = new EventsDAO();

    try {
      let event = await eventsDAO.get_one(event_id);

      response.statusCode = 200;
      response.data = event;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async update_event(req, res, next) {
    let response = {};

    let event_id = req.params.id;
    let event = req.body;
    let eventsDAO = new EventsDAO();
    let usersDAO = new UsersDAO();

    try {
      var eventExists = await eventsDAO.get_one(event_id);
    } catch (err) {
      if (err.type === "NOT_FOUND" || err.name === "CastError") {
        throw new Error._400("Event does not exist.");
      }
    }

    try {
      let userExists = await usersDAO.get_one(eventExists.user);
    } catch (err) {
      if (err.type === "NOT_FOUND" || err.name === "CastError") {
        throw new Error._400(
          "User does not exist. Need a valid User to create an event."
        );
      }
    }

    try {
      // Get the Event from the database and substitute the values that are in the request body.

      let updatedEvent = {
        ...eventExists,
        ...event,
      };

      logger.info(
        "Attempting to update Event in MongoDB: " +
          JSON.stringify(updatedEvent, null, 2) +
          "\n"
      );

      let updatedDocument = await eventsDAO.set(updatedEvent);

      response.statusCode = 200;
      response.data = updatedDocument;

      next(response);
    } catch (err) {
      logger.error("Error updating Event in MongoDB: " + err + "\n");
      next(err);
    }
  }

  static async destroy_event(req, res, next) {
    let response = {};

    let event_id = req.params.id;
    let eventsDAO = new EventsDAO();

    try {
      let deletedDocument = await eventsDAO.delete(event_id);

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
