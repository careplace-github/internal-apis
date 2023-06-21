// Import the express module
import Router from "express";
import express from "express";
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';

import AccessGuard from "../middlewares/guards/accessGuard.middleware";

import inputValidation from "../middlewares/validators/inputValidation.middleware";
// Import controllers
import ServicesController from "../controllers/services.controller";

const router = express.Router();

router.route("/services").get(ServicesController.listServices);

export default router;
