// Import the express module
import Router from "express";
import express from "express";



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
