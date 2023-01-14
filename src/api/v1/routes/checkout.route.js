// Import the express module
import Router from "express";
import express from "express";



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
