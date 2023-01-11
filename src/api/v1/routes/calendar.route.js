// Import the express module
import Router from "express";
import express from "express";


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"

// Import controllers
import CalendarController from "../controllers/calendar.controller.js";

const router = express.Router();

router
  .route("/calendar/events")
  .get(CalendarController.index_events)
  .post(CalendarController.create_event);

router
  .route("/calendar/events/:id")
  .get(CalendarController.show_event)
  .put(CalendarController.update_event)
  .delete(CalendarController.destroy_event);

router
  .route("/calendar/eventsSeries")
  .get(CalendarController.index_eventsSeries)
  .post(CalendarController.create_eventsSeries);

router
  .route("/calendar/eventsSeries/:id")
  .get(CalendarController.show_eventsSeries)
  .put(CalendarController.update_eventsSeries)
  .delete(CalendarController.destroy_eventsSeries);

export default router;
