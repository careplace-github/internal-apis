// Import the express module
import Router from "express";
import express from "express";
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware.js';

import AccessGuard from "../middlewares/guards/accessGuard.middleware.js";

import inputValidation from "../middlewares/validators/inputValidation.middleware.js";
// Import controllers
import ServicesController from "../controllers/services.controller.js";

const router = express.Router();

router.route("/services").get(ServicesController.listServices);

export default router;
