// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware.js";
import {
  AddOrderValidator,
  UpdateOrderValidator,
} from "../validators/orders.validator.js";

// Import Controller
import OrdersController from "../controllers/orders.controller.js";

const router = express.Router();

router.route("/orders")
  .post(OrdersController.create);





export default router;
