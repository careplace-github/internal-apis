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


  router.route("/companies/users").get(companiesController.getUsers);

router
  .route("/companies/:id")
  .get(companiesController.retrieve)
  .put( companiesController.update)
  .delete(companiesController.delete
  );

export default router;
