// Import Data Access Objects
import EventsDAO from "../db/events.dao.js";
import UsersDAO from "../db/users.dao.js";
import EventsSeriesDAO from "../db/eventsSeries.dao.js";
import logger from "../../../logs/logger.js";
import * as Error from "../utils/errors/http/index.js";
import AuthHelper from "../helpers/auth/auth.helper.js";
import CRUD from "./crud.controller.js";

import cognito from "../services/cognito.service.js";

/**
 * Create a new instance of the EventsSeriesDAO
 */
const eventsSeriesDAO = new EventsSeriesDAO();

/**
 * Create a new instance of the CRUD class.
 * This class has the basic CRUD operations/methods for the EventsSeriesDAO.
 */
const eventsSeriesCRUD = new CRUD(eventsSeriesDAO);

/**
 * Create a new instance of the EventsDAO
 */
const eventsDAO = new EventsDAO();

/**
 * Create a new instance of the CRUD class.
 * This class has the basic CRUD operations/methods for the EventsDAO.
 */
const eventsCRUD = new CRUD(eventsDAO);

/**
 * Create a new instance of the AuthHelper class.
 */
const authHelper = new AuthHelper();

/**
 * Calendar Controller Class to manage the ``/calendar`` endpoints of the API.
 */
export default class CalendarController {
  /**
   * Creates a new ``Event`` in the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
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

  /**
   * Retrieves an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   */
  static async retrieveEvent(req, res, next) {
    await eventsCRUD.retrieve(req, res, next);
  }

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   */
  static async update_event(req, res, next) {
    await eventsCRUD.updateByUserId(req, res, next);
  }

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   */
  static async deleteEvent(req, res, next) {
    await eventsCRUD.delete(req, res, next);
  }

  /**
   * Fetches all the ``Events`` from the MongoDB database from a certain user.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   */
  static async listEvents(req, res, next) {
    await eventsCRUD.listByUserId(req, res, next);
  }

  static async createEventSeries(req, res, next) {
    try {
      let response = {};

      let eventSeries = req.body;
      let eventsSeriesDAO = new EventsSeriesDAO();
      let usersDAO = new UsersDAO();

      /**
       * We already validate if there is a user in the request body in the Input Validation Middleware so we assume that req.body.user != null
       * We still need to check if the given id of the user exists in the database.
       */
      try {
        let userExists = await usersDAO.retrieve(eventSeries.user);
      } catch (err) {
        if (err.type === "NOT_FOUND" || err.name === "CastError") {
          throw new Error._400(
            "User does not exist. Need a valid User to create an event series."
          );
        }
      }

      let eventSeriesAdded = await eventsSeriesDAO.create(eventSeries);

      let eventSeriesAux = await eventsSeriesDAO.retrieveModel(
        eventSeriesAdded._id
      );

      let events = await eventSeriesAux.createEvents;

      let eventsAdded = [];

      for (let i = 0; i < events.length; i++) {
        let event = events[i];
        await eventsDAO.create(event);

        eventsAdded.push(event);
      }

      let responseData = {
        eventSeries: eventSeriesAdded,
        events: eventsAdded,
      };

      response.statusCode = 201;
      response.data = responseData;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  static async retrieveEventSeries(req, res, next) {
    await eventsSeriesCRUD.retrieve(req, res, next);
  }
  static async updateEventSeries(req, res, next) {
    await eventsSeriesCRUD.updateByUserId(req, res, next);
  }

  static async deleteEventSeries(req, res, next) {
    await eventsSeriesCRUD.delete(req, res, next);
  }

  static async listEventsSeries(req, res, next) {
    await eventsSeriesCRUD.listByUserId(req, res, next);
  }
}
