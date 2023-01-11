// Import the express module
import Router from "express";
import express from "express";


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"
// Import controllers
import companiesController from "../controllers/companies.controller.js";

const router = express.Router();

router
  .route("/companies")
 // .get(validateAuth, validateRole(["admin"]), companiesController.getCompanies)
  .post(companiesController.create);

router
  .route("/companies/:id")
  .get(companiesController.show)
  .put( companiesController.update)
  .delete(companiesController.destroy
  );

export default router;
