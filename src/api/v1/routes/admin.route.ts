// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware";

import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware";

// Import Controller
import CompaniesController from "../controllers/companies.controller";
import ServicesController from "../controllers/services.controller";

const router = express.Router();

router
  .route("/admin/companies")
  .get(CompaniesController.searchCompanies)
  .post(CompaniesController.create);

router
  .route("/admin/companies/:id")
  .get(CompaniesController.retrieve)
  .put(CompaniesController.update);

router.route("/admin/services").post(ServicesController.create);

router.route("/admin/services/:id").put(ServicesController.update);

export default router;
