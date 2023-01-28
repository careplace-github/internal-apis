// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import CompaniesController from "../controllers/companies.controller.js";
import OrdersController from "../controllers/orders.controller.js";
import UsersController from "../controllers/users.controller.js";
import StripeController from "../controllers/stripe.controller.js";
import DashboardController from "../controllers/dashboard.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";

const router = express.Router();

router.route("/companies/dashboard").get(AuthenticationGuard, DashboardController.getDashboard);

router.route("/companies/search").get(AuthenticationGuard, CompaniesController.searchCompanies);

router.route("/companies/orders").get(AuthenticationGuard, OrdersController.listOrdersByCompany);


router.route("/companies/users").get(AuthenticationGuard, UsersController.listUsersByCompany);

router
  .route("/companies/external-accounts")
  .post(AuthenticationGuard, StripeController.createExternalAccount)
  .get(AuthenticationGuard, StripeController.listExternalAccounts);

router
  .route("/companies/external-accounts/:id")
  .get(AuthenticationGuard, StripeController.retrieveExternalAccount)
  .delete(AuthenticationGuard, StripeController.deleteExternalAccount);

router.route("/companies/:id").get(AuthenticationGuard, CompaniesController.retrieve);

router.route("/companies/orders/:id/accept").post(AuthenticationGuard, OrdersController.acceptOrder);

router.route("/companies/orders/:id/decline").post(AuthenticationGuard, OrdersController.declineOrder);

router.route("/companies/orders/:id/send-quote").post(AuthenticationGuard, OrdersController.sendQuote);

router
  .route("/companies/orders/:id")
  .get(AuthenticationGuard, OrdersController.retrieve)
  .put(AuthenticationGuard, OrdersController.update)
  .delete(AuthenticationGuard, OrdersController.delete);

router
  .route("/companies/orders/:id/send-quote")
  .post(AuthenticationGuard, OrdersController.sendQuote);



export default router;
