// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import UsersController from "../controllers/users.controller.js";
import OrdersController from "../controllers/orders.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";
import AccessGuard from "../middlewares/guards/accessGuard.middleware.js";

const router = express.Router();

router
  .route("/users/orders")
  .get(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    OrdersController.listOrdersByUser
  );
router
  .route("/users/orders/:id")
  .get(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    OrdersController.retrieve
  );

router
  .route("/users/account")
  .get(AuthenticationGuard, UsersController.account);

export default router;
