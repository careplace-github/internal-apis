// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
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
  .get(CalendarController.listEvents)
  .post(AddEventValidator, InputValidation, CalendarController.createEvent);

router
  .route("/calendar/events/:id")
  .get(CalendarController.retrieveEvent)
  .put(UpdateEventValidator, InputValidation, CalendarController.update_event)
  .delete(CalendarController.deleteEvent);

router
  .route("/calendar/events-series")
  .get(CalendarController.listEventsSeries)
  .post(CalendarController.createEventSeries);

router
  .route("/calendar/events-series/:id")
  .get(CalendarController.retrieveEventSeries)
  .put(CalendarController.updateEventSeries)
  .delete(CalendarController.deleteEventSeries);

export default router;
