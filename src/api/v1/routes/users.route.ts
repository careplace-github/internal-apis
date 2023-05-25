// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import UsersController from "../controllers/users.controller";
import OrdersController from "../controllers/orders.controller";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware";
import AccessGuard from "../middlewares/guards/accessGuard.middleware";

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
  .get(AuthenticationGuard, UsersController.account)
  .put(AuthenticationGuard, UsersController.updateAccount);

  router
  .route("/account")
  .get(AuthenticationGuard, UsersController.account)
  .put(AuthenticationGuard, UsersController.updateAccount);

export default router;
