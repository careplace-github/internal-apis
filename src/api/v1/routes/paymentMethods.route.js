import express from "express";

// Import Controller
import StripeController from "../controllers/stripe.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";

const router = express.Router();

router
  .route("/payment-methods")
  .post(AuthenticationGuard, StripeController.createPaymentMethod)
  .get(AuthenticationGuard, StripeController.listPaymentMethods);

router
  .route("/payment-methods/:id")
  .get(AuthenticationGuard, StripeController.retrievePaymentMethod)
  .delete(AuthenticationGuard, StripeController.deletePaymentMethod);

export default router;
