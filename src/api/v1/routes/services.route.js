// Import the express module
import Router from "express";
import express from "express";


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"
// Import controllers
import ServicesController from "../controllers/services.controller.js";

const router = express.Router();

router
  .route("/services")
  .get(ServicesController.index)
  //.post(ServicesController.create);

router
  .route("/services/:id")
 // .get(ServicesController.show)
  // .delete(ServicesController.update);

export default router;
