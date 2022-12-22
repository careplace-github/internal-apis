// Import the express module
import Router from "express";
import express from "express";

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js";
import validateRole from "../middlewares/role.middleware.js";

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
  .put(validateAuth, validateRole(["admin"]), companiesController.update)
  .delete(validateAuth, validateRole(["admin"]), companiesController.destroy
  );

export default router;
