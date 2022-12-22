// Import the express module
import Router from "express";
import express from "express";

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js";
import validateRole from "../middlewares/role.middleware.js";
import validateAccess from "../middlewares/access.middleware.js";

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
