// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// lodash
import { omit, pick } from 'lodash';

// @api
import {
  HealthUnitsDAO,
  HomeCareOrdersDAO,
  HealthUnitReviewsDAO,
  CollaboratorsDAO,
  CustomersDAO,
  EventsDAO,
  EventSeriesDAO,
} from '@packages/database';
import { AuthHelper, OrdersHelper, CalendarHelper } from '@packages/helpers';
import {
  IAPIResponse,
  ICollaborator,
  ICustomer,
  IHealthUnitReview,
  IOrder,
  IHealthUnit,
  IQueryListResponse,
  IEvent,
  IEventDocument,
  IEventSeriesDocument,
  IEventSeries,
} from 'src/packages/interfaces';
import {
  CaregiverModel,
  CollaboratorModel,
  EventModel,
  EventSeriesModel,
} from 'src/packages/models';
import { CognitoService, StripeService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';

export default class CalendarController {
  // db
  static CollaboratorsDAO = new CollaboratorsDAO();

  static CustomersDAO = new CustomersDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static EventsDAO = new EventsDAO();

  static EventSeriesDAO = new EventSeriesDAO();

  // services
  static StripeService = new StripeService();

  // helpers
  static AuthHelper = AuthHelper;

  static OrdersHelper = OrdersHelper;

  static CalendarHelper = CalendarHelper;

  // -------------------------------------------------- //
  //                     COLLABORATORS                  //
  // -------------------------------------------------- //

  /**
   * Creates a new ``Event`` for a Collaborator in the MongoDB database.
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

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const event = req.body as { event: IEvent };

      logger.info('event: ', JSON.stringify(event, null, 2));

      const newEvent = new EventModel(event);

      // validate the event
      const validationError = newEvent.validateSync({ pathsToSkip: ['owner', 'owner_type'] });

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      newEvent.owner_type = 'collaborator';
      newEvent.owner = user._id;

      let eventAdded: IEventDocument;

      try {
        eventAdded = await CalendarController.EventsDAO.create(newEvent);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 201;
      response.data = eventAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      const eventId = req.params.id;
      let event: IEventDocument;

      try {
        event = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      logger.info('USER._ID: ', user._id);

      if (event.owner.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You do not have access to this event.'));
      }

      response.statusCode = 200;
      response.data = event;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      const eventId = req.params.id;
      let eventExists: IEventDocument;

      try {
        eventExists = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (eventExists.owner.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You do not have access to this event.'));
      }

      // get the event fields to update from the request body
      const reqEvent = req.body as IEvent;

      const sanitizedReqEvent = omit(reqEvent, ['owner_type', 'owner', '_id']);

      const newEvent = {
        ...eventExists.toJSON(),
        ...sanitizedReqEvent,
      };

      const updateEvent = new EventModel(newEvent);

      let updatedEvent: IEventDocument;

      try {
        updatedEvent = await CalendarController.EventsDAO.update(updateEvent);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = updatedEvent;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async deleteCollaboratorEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      const eventId = req.params.id;
      let eventExists: IEventDocument;

      try {
        eventExists = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (eventExists.owner.toString() !== user._id.toString()) {
        return next(new HTTPError._403('You do not have access to this event.'));
      }

      try {
        await CalendarController.EventsDAO.delete(eventId);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Event deleted successfully' };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

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

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      let events: IEventDocument[];
      events = await CalendarController.EventsDAO.queryList({ owner: user._id }).then(
        (events) => events.data
      );

      response.statusCode = events.length > 0 ? 200 : 204;
      response.data = events;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // -------------------------------------------------- //
  //                     HEALTH UNITS                   //
  // -------------------------------------------------- //

  // EVENTS

  static async createHealthUnitEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      const { event } = req.body as { event: IEvent };

      const newEvent = new EventModel(event);

      // validate the event
      const validationError = newEvent.validateSync();

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      // Set the owner_type and owner based on the user's health unit
      newEvent.owner_type = 'health_unit';
      newEvent.owner = user.health_unit;

      let eventAdded: IEventDocument;

      try {
        eventAdded = await CalendarController.EventsDAO.create(newEvent);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 201;
      response.data = eventAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnitEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      const eventId = req.params.id;
      let event: IEventDocument;

      try {
        event = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (
        event.owner_type !== 'health_unit' ||
        event.owner !== user.health_unit ||
        !user.permissions.includes('calendar_view')
      ) {
        return next(new HTTPError._403('You do not have access to this event.'));
      }

      response.statusCode = 200;
      response.data = event;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateHealthUnitEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      const eventId = req.params.id;
      let eventExists: IEventDocument;

      try {
        eventExists = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      logger.info(`user.health_unit: ${user.health_unit}`);

      if (
        eventExists.owner_type !== 'health_unit' ||
        eventExists.owner.toString() !== user.health_unit._id.toString() ||
        !user.permissions.includes('calendar_edit')
      ) {
        return next(new HTTPError._403('You do not have access to update this event.'));
      }

      // Get the event fields to update from the request body
      const reqEvent = req.body as IEvent;

      // Exclude fields that should not be updated
      const sanitizedReqEvent = omit(reqEvent, ['owner_type', 'owner', '_id', 'order']);

      const newEvent = {
        ...eventExists.toObject(),
        ...sanitizedReqEvent,
      };

      const updateEvent = new EventModel(newEvent);

      let updatedEvent: IEventDocument;

      try {
        updatedEvent = await CalendarController.EventsDAO.update(updateEvent);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = updatedEvent;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async deleteHealthUnitEvent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      const eventId = req.params.id;
      let eventExists: IEventDocument;

      try {
        eventExists = await CalendarController.EventsDAO.retrieve(eventId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (
        eventExists.owner_type !== 'health_unit' ||
        eventExists.owner.toString() !== user.health_unit._id.toString() ||
        !user.permissions.includes('calendar_edit')
      ) {
        return next(new HTTPError._403('You do not have access to delete this event.'));
      }

      // Delete the event
      try {
        await CalendarController.EventsDAO.delete(eventExists._id);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = { message: 'Event deleted successfully' };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async listHealthUnitEvents(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      let events: IEventDocument[] = [];

      let eventsSeries: IEventSeriesDocument[] = [];

      if (user.permissions.includes('calendar_view')) {
        try {
          const healthUnitEvents = await CalendarController.EventsDAO.queryList(
            { owner: user.health_unit._id },
            undefined,
            undefined,
            undefined,
            [
              {
                path: 'order',
                model: 'HomeCareOrder',
                populate: {
                  path: 'caregiver',
                  model: 'Caregiver',
                  select: 'name email profile_picture',
                },
              },
            ]
          ).then((events) => events.data);

          // add the healthUnitEvents to the events array
          events = events.concat(healthUnitEvents);
        } catch (error: any) {
          switch (error.type) {
            case 'NOT_FOUND':
              break;
            default:
              return next(new HTTPError._500(error.message));
          }
        }

        try {
          eventsSeries = await CalendarController.EventSeriesDAO.queryList(
            { owner: user.health_unit._id },
            undefined,
            undefined,
            undefined,
            [
              {
                path: 'order',
                model: 'HomeCareOrder',
              },
            ]
          ).then((eventsSeries) => eventsSeries.data);
        } catch (error: any) {
          switch (error.type) {
            case 'NOT_FOUND':
              break;
            default:
              return next(new HTTPError._500(error.message));
          }
        }

        /**
         * for each eventSeries, generate the events and add them to the events array
         */
        for (let i = 0; i < eventsSeries.length; i++) {
          const eventSeries = eventsSeries[i];

          const eventsGenerated =
            (await CalendarController.CalendarHelper.generateEventsFromSeries(eventSeries)) || [];

          events = [...events, ...eventsGenerated];
        }
      }

      response.statusCode = events.length > 0 ? 200 : 204;
      response.data = events;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  // EVENT SERIES
  static async listHealthUnitEventSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    /**
     * Get the event series from the database.
     *
     * If user.permissions.includes("calendar_edit") then also return every eventSeries with health-unit = user.health-unit
     */
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      let eventSeries: IEventSeriesDocument[] = [];
      if (!user.permissions.includes('calendar_view')) {
        return next(new HTTPError._403('You do not have access to view this event series.'));
      }

      try {
        eventSeries = await CalendarController.EventSeriesDAO.queryList(
          { health_unit: user.health_unit._id },
          undefined,
          undefined,
          undefined,
          [
            {
              path: 'order',
              model: 'HomeCareOrder',
            },
          ]
        ).then((eventSeries) => eventSeries.data);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            break;
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = eventSeries.length > 0 ? 200 : 204;
      response.data = eventSeries;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      return next(new HTTPError._500(error.message));
    }
  }

  static async createHealthUnitEventSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    /**
     * Create a new event series for a health unit.
     *
     * If user.permissions.includes("calendar_edit") then also return every eventSeries with health-unit = user.health-unit
     */
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (!user.permissions.includes('calendar_edit')) {
        return next(new HTTPError._403('You do not have access to create an event series.'));
      }

      const { eventSeries } = req.body as { eventSeries: IEventSeries };

      const newEventSeries = new EventSeriesModel(eventSeries);

      // Set the health unit based on the user's health unit
      newEventSeries.owner = user.health_unit;
      newEventSeries.owner_type = 'health_unit';

      // validate the event series
      const validationError = newEventSeries.validateSync();

      if (validationError) {
        return next(new HTTPError._400(validationError.message));
      }

      let eventSeriesAdded: IEventSeriesDocument;

      try {
        eventSeriesAdded = await CalendarController.EventSeriesDAO.create(newEventSeries);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 201;
      response.data = eventSeriesAdded;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnitEventSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (!user.permissions.includes('calendar_view')) {
        return next(new HTTPError._403('You do not have access to view this event series.'));
      }

      const eventSeriesId = req.params.id;
      let eventSeriesExists: IEventSeriesDocument;

      try {
        eventSeriesExists = await CalendarController.EventSeriesDAO.retrieve(eventSeriesId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event series not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = eventSeriesExists;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateHealthUnitEventSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      let accessToken: string;

      // Check if there is an authorization header
      if (req.headers.authorization) {
        // Get the access token from the authorization header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        // If there is no authorization header, return an error
        return next(new HTTPError._401('Missing required access token.'));
      }

      const user = await CalendarController.AuthHelper.getUserFromDB(accessToken);

      if (!(user instanceof CollaboratorModel)) {
        return next(new HTTPError._403('You are not authorized to access this resource.'));
      }

      if (!user.permissions.includes('calendar_edit')) {
        return next(new HTTPError._403('You do not have access to update this event series.'));
      }

      const eventSeriesId = req.params.id;
      let eventSeriesExists: IEventSeriesDocument;

      try {
        eventSeriesExists = await CalendarController.EventSeriesDAO.retrieve(eventSeriesId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HTTPError._404('Event series not found.'));
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      if (eventSeriesExists.owner.toString() !== user.health_unit._id.toString()) {
        return next(new HTTPError._403('You do not have access to update this event series.'));
      }

      // Get the event series fields to update from the request body
      const reqEventSeries = req.body as IEventSeries;

      // Do not allow to change the health unit or the _id
      const sanitizedReqEventSeries = omit(reqEventSeries, ['health_unit', '_id']);

      // Check if the EventSeries is related to an order, if so only allow to update the description and textColor fields
      let updateFields: IEventSeries;

      // EventSeries is related to an order
      if (eventSeriesExists?.order) {
        updateFields = {
          ...eventSeriesExists.toObject(),
          description: sanitizedReqEventSeries.description,
          textColor: sanitizedReqEventSeries.textColor || eventSeriesExists.textColor,
          title: sanitizedReqEventSeries.title || eventSeriesExists.title,
        };
        // EventSeries is not related to an order
      } else {
        updateFields = {
          ...eventSeriesExists.toObject(),
          ...sanitizedReqEventSeries,
        };
      }

      const updateEventSeries = new EventSeriesModel(updateFields);

      let updatedSeries: IEventSeriesDocument;

      try {
        updatedSeries = await CalendarController.EventSeriesDAO.update(updateEventSeries);
      } catch (error: any) {
        switch (error.type) {
          default:
            return next(new HTTPError._500(error.message));
        }
      }

      response.statusCode = 200;
      response.data = updatedSeries;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
