import eventsDAO from '../db/events.dao';
import UsersDAO from '../db/crmUsers.dao';
import eventsSeriesDAO from '../db/eventsSeries.dao';
import * as Error from '../utils/errors/http/index';
import authHelper from '../helpers/auth/auth.helper';
import CRUD from './crud.controller';
import logger from '../../../logs/logger';
// helper functions
import { generateEventsFromSeries } from '../helpers';

let EventsDAO = new eventsDAO();
let EventsSeriesDAO = new eventsSeriesDAO();

/**
 * Calendar Controller Class to manage the ``/calendar`` endpoints of the API.
 */
export default class CalendarController {
  /**
   * Creates a new ``Event`` in the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async createEvent(req, res, next) {
    try {
      let response = {};

      let event = req.body;
      // let EventsDAO = new EventsDAO();
      let AuthHelper = new authHelper();

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('Missing required access token.');
      }

      let user = await AuthHelper.getUserFromDB(accessToken);

      event.user = user._id;

      let eventAdded = await EventsDAO.create(event);

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
   * @param {*} next - Next middleware function.
   */
  static async retrieveEvent(req, res, next) {
    let EventsCRUD = new CRUD(EventsDAO);
    await EventsCRUD.retrieve(req, res, next);
  }

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async update_event(req, res, next) {
    let EventsCRUD = new CRUD(EventsDAO);
    await EventsCRUD.updateByUserId(req, res, next);
  }

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async deleteEvent(req, res, next) {
    let EventsCRUD = new CRUD(EventsDAO);
    await EventsCRUD.delete(req, res, next);
  }

  /**
   * Fetches all the ``Events`` from the MongoDB database from a certain user.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async listEvents(req, res, next) {
    /**
     * Get the events from the database.
     *
     * If user.permissions.includes("calendar_edit") then also return every eventSeries with company = user.company
     */
    try {
      let response = {};

      let EventsDAO = new eventsDAO();
      let AuthHelper = new authHelper();

      let accessToken;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._401('Missing required access token.');
      }

      let user = await AuthHelper.getUserFromDB(accessToken);

      let events = await EventsDAO.query_list({ user: user._id }).then((events) => {
        return events.data;
      });
      let eventsSeries = [];

      if (user.permissions.includes('calendar_view')) {
        
        eventsSeries = await EventsSeriesDAO
          .query_list({ company: user.company._id })
          .then((eventsSeries) => {
            return eventsSeries.data;
          });

        /**
         * for each eventSeries, generate the events and add them to the events array
         */
        for (let i = 0; i < eventsSeries.length; i++) {
          let eventSeries = eventsSeries[i];

          let eventsGenerated = await generateEventsFromSeries(eventSeries);

          events = [...events, ...eventsGenerated];
        }
      }

      response.statusCode = 200;
      response.data = {
        events: events,
        eventsSeries: eventsSeries,
      };

      next(response);
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  // -------------------------------------------------------------------------------------------- //
  //                                           IN DEVELOPMENT                                     //
  // -------------------------------------------------------------------------------------------- //

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
        if (err.type === 'NOT_FOUND' || err.name === 'CastError') {
          throw new Error._400('User does not exist. Need a valid User to create an event series.');
        }
      }

      let eventSeriesAdded = await eventsSeriesDAO.create(eventSeries);

      let eventSeriesAux = await eventsSeriesDAO.retrieveModel(eventSeriesAdded._id);

      let events = await eventSeriesAux.createEvents;

      let eventsAdded = [];

      for (let i = 0; i < events.length; i++) {
        let event = events[i];
        await EventsDAO.create(event);

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
    let eventsSeriesCRUD = new CRUD(EventsSeriesDAO);
    await eventsSeriesCRUD.retrieve(req, res, next);
  }
  static async updateEventSeries(req, res, next) {
    let eventsSeriesCRUD = new CRUD(EventsSeriesDAO);
    await eventsSeriesCRUD.updateByUserId(req, res, next);
  }

  static async deleteEventSeries(req, res, next) {
    let eventsSeriesCRUD = new CRUD(EventsSeriesDAO);
    await eventsSeriesCRUD.delete(req, res, next);
  }

  static async listEventsSeries(req, res, next) {
    let eventsSeriesCRUD = new CRUD(EventsSeriesDAO);
    await eventsSeriesCRUD.listByUserId(req, res, next);
  }
}
