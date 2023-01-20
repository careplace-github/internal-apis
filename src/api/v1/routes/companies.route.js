// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import companiesController from "../controllers/companies.controller.js";
import OrdersController from "../controllers/orders.controller.js";

const router = express.Router();

router.route("/companies").get(companiesController.listCompanies);

router.route("/companies/orders").get(companiesController.getOrders);

router
  .route("/companies/orders/:id")
  .get(OrdersController.retrieve)
  .put(OrdersController.update)
  .delete(OrdersController.delete);

router.route("/companies/users").get(companiesController.getUsers);

//router.route("/companies/:id").get(companiesController.retrieve);

export default router;
