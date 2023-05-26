// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware";
import {
  AddEventValidator,
  UpdateEventValidator,
} from "../validators/events.validator.js";

import CreateEventSeriesValidator from "../validators/eventsSeries.validator.js";

// Import Controller
import CalendarController from "../controllers/calendar.controller";
import AccessGuard from "../middlewares/guards/accessGuard.middleware";

const router = express.Router();

router
  .route("/calendar/events")
  .get(
    AuthenticationGuard,
    AccessGuard("crm"),
    
    
    CalendarController.listEvents
  )
  .post(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    AddEventValidator,
    InputValidation,
    CalendarController.createEvent
  );

router
  .route("/calendar/events/:id")
  .get(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.retrieveEvent
  )
  .put(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.update_event
  )
  .delete(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.deleteEvent
  );

router
  .route("/calendar/events-series")
  .get(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.listEventsSeries
  )
  .post(
    AuthenticationGuard,
    InputValidation,
    CalendarController.createEventSeries
  );

router
  .route("/calendar/events-series/:id")
  .get(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.retrieveEventSeries
  )
  .put(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.updateEventSeries
  )
  .delete(
    AuthenticationGuard,
    AccessGuard("crm"),
    InputValidation,
    CalendarController.deleteEventSeries
  );

export default router;
