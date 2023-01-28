// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";
import {
  AddEventValidator,
  UpdateEventValidator,
} from "../validators/events.validator.js";

import CreateEventSeriesValidator from "../validators/eventsSeries.validator.js";

// Import Controller
import CalendarController from "../controllers/calendar.controller.js";

const router = express.Router();

router
  .route("/calendar/events")
  .get(InputValidation, CalendarController.listEvents)
  .post(InputValidation, AddEventValidator, InputValidation, CalendarController.createEvent);

router
  .route("/calendar/events/:id")
  .get(InputValidation, CalendarController.retrieveEvent)
  .put(InputValidation, UpdateEventValidator, InputValidation, CalendarController.update_event)
  .delete(InputValidation, CalendarController.deleteEvent);

router
  .route("/calendar/events-series")
  .get(InputValidation, CalendarController.listEventsSeries)
  .post(InputValidation, CalendarController.createEventSeries);

router
  .route("/calendar/events-series/:id")
  .get(InputValidation, CalendarController.retrieveEventSeries)
  .put(InputValidation, CalendarController.updateEventSeries)
  .delete(InputValidation, CalendarController.deleteEventSeries);

export default router;
