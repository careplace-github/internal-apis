// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import companiesController from "../controllers/companies.controller.js";
import OrdersController from "../controllers/orders.controller.js";

const router = express.Router();

router.route("/companies/search").get(companiesController.searchCompanies);

router.route("/companies/orders").get(companiesController.getOrders);

router.route("/companies/:id").get(companiesController.retrieve);

router
  .route("/companies/orders/:id")
  .get(OrdersController.retrieve)
  .put(OrdersController.update)
  .delete(OrdersController.delete);

router
  .route("/companies/orders/:id/send-quote")
  .post(OrdersController.sendQuote);

router.route("/companies/users").get(companiesController.getUsers);



export default router;
