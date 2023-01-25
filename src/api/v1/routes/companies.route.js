// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import CompaniesController from "../controllers/companies.controller.js";
import OrdersController from "../controllers/orders.controller.js";
import UsersController from "../controllers/users.controller.js";
import StripeController from "../controllers/stripe.controller.js";

const router = express.Router();

router.route("/companies/search").get(CompaniesController.searchCompanies);

router.route("/companies/orders").get(OrdersController.listOrdersByCompany);

router
  .route("/companies/external-accounts")
  .post(StripeController.createExternalAccount)
  .get(StripeController.listExternalAccounts);

router
  .route("/companies/external-accounts/:id")
  .get(StripeController.retrieveExternalAccount)
  .delete(StripeController.deleteExternalAccount);

router.route("/companies/:id").get(CompaniesController.retrieve);

router.route("/companies/orders/:id/accept").post(OrdersController.acceptOrder);

router.route("/companies/orders/:id/decline").post(OrdersController.declineOrder);

router.route("/companies/orders/:id/send-quote").post(OrdersController.sendQuote);

router
  .route("/companies/orders/:id")
  .get(OrdersController.retrieve)
  .put(OrdersController.update)
  .delete(OrdersController.delete);

router
  .route("/companies/orders/:id/send-quote")
  .post(OrdersController.sendQuote);

router.route("/companies/users").get(UsersController.listUsersByCompany);

export default router;
