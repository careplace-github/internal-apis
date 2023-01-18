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
  .get(CalendarController.indexEvents)
  .post(AddEventValidator, InputValidation, CalendarController.createEvent);

router
  .route("/calendar/events/:id")
  .get(CalendarController.retrieveEvent)
  .put(UpdateEventValidator, InputValidation, CalendarController.update_event)
  .delete(CalendarController.destroyEvent);

router
  .route("/calendar/events-series")
  .get(CalendarController.indexEventsSeries)
  .post(CreateEventSeriesValidator, InputValidation, CalendarController.createEventsSeries);

router
  .route("/calendar/events-series/:id")
  .get(CalendarController.retrieveEventsSeries)
  .put(CalendarController.updateEventsSeries)
  .delete(CalendarController.destroyEventsSeries);

export default router;
