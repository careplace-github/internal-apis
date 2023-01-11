// Import the express module
import Router from "express";
import express from "express";


// Import middlewares
import authenticationGuard from "../middlewares/authenticationGuard.middleware.js"
import roleBasedGuard from "../middlewares/roleBasedGuard.middleware.js"
import accessGuard from "../middlewares/accessGuard.middleware.js"
import inputValidation from "../middlewares/inputValidation.middleware.js"
// Import controllers
import CheckoutController from "../controllers/checkout.controller.js";
const router = express.Router();

/**
 * @debug
 */
router
.route("/checkout/payment-intent")
.post(CheckoutController.createPaymentIntent);


router
  .route("/checkout/order/:id/payment-intent")
  .post(CheckoutController.createPaymentIntent);

router
  .route("/checkout/order/:id/confirm-payment")
  .post(CheckoutController.confirmPayment);

export default router;
