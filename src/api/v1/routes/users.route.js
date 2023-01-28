// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import UsersController from "../controllers/users.controller.js";
import OrdersController from "../controllers/orders.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";

const router = express.Router();

router.route("/users").get(AuthenticationGuard, UsersController.index);

router
  .route("/users/orders")
  .get(AuthenticationGuard, OrdersController.listOrdersByUser);
router
  .route("/users/orders/:id")
  .get(AuthenticationGuard, OrdersController.retrieve);

router
  .route("/users/account")
  .get(AuthenticationGuard, UsersController.account);

export default router;
