// Import the express module
import express from "express";

// Import Middlewares
import InputValidation from "../middlewares/validators/inputValidation.middleware";
import {
  AddOrderValidator,
  UpdateOrderValidator,
} from "../validators/orders.validator";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware";
import AccessGuard from "../middlewares/guards/accessGuard.middleware";

// Import Controller
import OrdersController from "../controllers/orders.controller";

const router = express.Router();

router.route("/orders")
  .post(AuthenticationGuard, AccessGuard("marketplace"), OrdersController.create);





export default router;
