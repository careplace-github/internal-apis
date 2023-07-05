// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  CustomersDAO,
  EventsDAO,
  EventSeriesDAO,
} from '@api/v1/db';
import { AuthHelper, OrdersHelper } from '@api/v1/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICustomer,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IEvent,
} from '@api/v1/interfaces';
import { EventModel } from '@api/v1/models';
import { CognitoService, StripeService } from '@api/v1/services';
import { HTTPError } from '@api/v1/utils';
// @logger
import logger from '@logger';
export default class CalendarController {
  // db
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CustomersDAO = new CustomersDAO();
  static HealthUnitsDAO = new HealthUnitsDAO();
  static EventsDAO = new EventsDAO();
  static EventsSeriesDAO = new EventSeriesDAO();
  // services
  static StripeService = new StripeService();
  // helpers
  static AuthHelper = AuthHelper;
  static OrdersHelper = OrdersHelper;

  /**
   * Creates a new ``Event`` in the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async createCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { event } = req.body as { event: IEvent };

      const newEvent = new EventModel(event);

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      event.ownerType = 'collaborator';
      event.owner = user.id;

      const eventAdded = await this.EventsDAO.create(newEvent);

      response.statusCode = 201;
      response.data = eventAdded;

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * Retrieves an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async retrieveCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async updateCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  /**
   * Deletes an ``Event`` from the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async deleteCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {}

  /**
   * Fetches all the ``Events`` from the MongoDB database from a certain user.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async listCollaboratorEvents(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    /**
     * Get the events from the database.
     *
     * If user.permissions.includes("calendar_edit") then also return every eventSeries with health-unit = user.health-unit
     */
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const eventsDAO = new EventsDAO();
      const authHelper = new AuthHelper();

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await this.AuthHelper.getUserFromDB(accessToken);

      let events: any[];
      events = await eventsDAO.queryList({ user: user._id }).then((events) => {
        return events.data;
      });
      let eventsSeries: any[] = [];

      if (user.permissions.includes('calendar_view')) {
        eventsSeries = await this.EventsSeriesDAO.queryList(
          { health_unit: user.health_unit._id },
          undefined,
          undefined,
          undefined,
          [
            {
              path: 'order',
              model: 'Order',
            },
          ]
        ).then((eventsSeries) => {
          return eventsSeries.data;
        });

        /**
         * for each eventSeries, generate the events and add them to the events array
         */
        for (let i = 0; i < eventsSeries.length; i++) {
          const eventSeries = eventsSeries[i];

          const eventsGenerated = await this.OrdersHelper.generateEventsFromSeries(eventSeries);

          events = [...events, ...eventsGenerated];
        }
      }

      response.statusCode = 200;
      response.data = {
        events: events,
        eventsSeries: eventsSeries,
      };

      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
