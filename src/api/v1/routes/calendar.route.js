// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
import {
  AddEventValidator,
  UpdateEventValidator,
} from "../validators/event.validator.js";

// Import Controller
import CalendarController from "../controllers/calendar.controller.js";

const router = express.Router();

router
  .route("/calendar/events")
  .get(CalendarController.index_events)
  .post(AddEventValidator, InputValidation, CalendarController.create_event);

router
  .route("/calendar/events/:id")
  .get(CalendarController.show_event)
  .put(UpdateEventValidator, InputValidation, CalendarController.update_event)
  .delete(CalendarController.destroy_event);

router
  .route("/calendar/events_series")
  .get(CalendarController.index_eventsSeries)
  .post(CalendarController.create_eventsSeries);

router
  .route("/calendar/events_series/:id")
  .get(CalendarController.show_eventsSeries)
  .put(CalendarController.update_eventsSeries)
  .delete(CalendarController.destroy_eventsSeries);

export default router;
