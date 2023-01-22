// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";



// Import Controller
import CompaniesController from "../controllers/companies.controller.js";
import AuthController from "../controllers/authentication.controller";
import ServicesController from "../controllers/services.controller.js";

const router = express.Router();

router.route("/admin/auth/login")
.post(AuthController.adminLogin);

router.route("/admin/auth/logout")
.post(AuthController.logout);

router.route("/admin/companies")
.get(CompaniesController.searchCompanies)
.post(CompaniesController.create);

router.route("/admin/companies/:id")
.get(CompaniesController.retrieve)
.put(CompaniesController.update);

router.route("/admin/services")
.get(ServicesController.searchServices)
.post(ServicesController.create);

router.route("/admin/services/:id")
.get(ServicesController.retrieve)
.put(ServicesController.update);



export default router;
