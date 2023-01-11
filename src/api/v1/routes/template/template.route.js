// Importing the express module
import express from "express";
// Import Middlewares
import authenticationGuard from "../../middlewares/authenticationGuard.middleware.js";
import roleBasedGuard from "../../middlewares/roleBasedGuard.middleware.js";
import accessGuard from "../../middlewares/accessGuard.middleware.js";
import inputValidation from "../../middlewares/inputValidation.middleware.js";
// Import Controller
import TemplateController from "../../controllers/template/template.controller.js";

// Create a router
const router = express.Router();

/**
 * @todo implement input validation middleware
 */

/**
 * @swagger
 */
router.route("/template")
    .get(authenticationGuard, roleBasedGuard["user","admin"], TemplateController.index )
    .post(authenticationGuard, roleBasedGuard["user","admin"], inputValidation, TemplateController.create);

router.route("/template/:id")
    .get(authenticationGuard, roleBasedGuard["user","admin"], accessGuard, TemplateController.show)
    .put(authenticationGuard, roleBasedGuard["user","admin"], accessGuard, validator, TemplateController.update)
    .delete(authenticationGuard, roleBasedGuard["user","admin"], accessGuard, TemplateController.destroy);    
    

export default router;

acct_1MOqmhEL6cuwRb9O
