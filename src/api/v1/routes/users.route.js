// Import the express module
import Router from "express";
import express from "express";

// Import controllers
import UsersController from "../controllers/users.controller.js";
import OrdersController from "../controllers/orders.controller.js";

const router = express.Router();

router.route("/users").get(UsersController.index);

router.route("/users/orders").get(OrdersController.listOrdersByUser);
router.route("/users/orders/:id").get(OrdersController.retrieve);

router.route("/users/account").get(UsersController.account);

export default router;
