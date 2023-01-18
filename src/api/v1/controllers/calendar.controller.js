// Import Data Access Objects
import EventsDAO from "../db/events.dao.js";
import UsersDAO from "../db/users.dao.js";
import EventsSeriesDAO from "../db/eventsSeries.dao.js";
// Import Utils
import requestUtils from "../utils/server/request.utils.js";
import errorUtils from "../utils/errors/error.utils.js";
// Import logger
import logger from "../../../logs/logger.js";
import * as Error from "../helpers/errors/errors.helper.js";
import AuthHelper from "../helpers/auth/auth.helper.js";
import CRUD from "./crud.controller.js";

/**
 * Create a new instance of the EventsSeriesDAO
 */
const eventsSeriesDAO = new EventsSeriesDAO();

/**
 * Create a new instance of the CRUD class.
 * This class has the basic CRUD operations/methods for the EventsSeriesDAO.
 */
const eventsCRUD = new CRUD(eventsSeriesDAO);


/**
 * Create a new instance of the AuthHelper class.
 */
const authHelper = new AuthHelper();


/**
 * @class CalendarController
 */
export default class CalendarController {
  


/**
 * 
 * @param {express.Request} req 
 * @param {*} res 
 * @param {*} next 
 */
  static async createEvent(req, res, next) {
    try {
      let response = {};

      let event = req.body;
      let eventsDAO = new EventsDAO();
      let usersDAO = new UsersDAO();

      try {
        let userExists = await usersDAO.retrieve(event.user);
      } catch (err) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "User does not exist. Need a valid User to create an event."
          );
        }
      }

      let eventAdded = await eventsDAO.create(event);

      response.statusCode = 201;
      response.data = eventAdded;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async retrieveEvent(req, res, next) {
    let response = {};

    let event_id = req.params.id;
    let eventsDAO = new EventsDAO();

    try {
      let event = await eventsDAO.retrieve(event_id);

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
      var eventExists = await eventsDAO.retrieve(event_id);
    } catch (err) {
      if (err.type === "NOT_FOUND" || err.name === "CastError") {
        throw new Error._400("Event does not exist.");
      }
    }

    try {
      let userExists = await usersDAO.retrieve(eventExists.user);
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

      let updatedDocument = await eventsDAO.update(updatedEvent);

      response.statusCode = 200;
      response.data = updatedDocument;

      next(response);
    } catch (err) {
      logger.error("Error updating Event in MongoDB: " + err + "\n");
      next(err);
    }
  }

  static async destroyEvent(req, res, next) {
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


  static async indexEvents(req, res, next) {}



  static async createEventsSeries(req, res, next) {
    await eventsCRUD.create(req, res, next);
  }

  static async retrieveEventsSeries(req, res, next) {}

  static async updateEventsSeries(req, res, next) {}

  static async destroyEventsSeries(req, res, next) {}

  static async indexEventsSeries(req, res, next) {}
}
