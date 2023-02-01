import express from "express";

// Import Controller
import StripeController from "../controllers/stripe.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";
import AccessGuard from "../middlewares/guards/accessGuard.middleware.js";

const router = express.Router();

router
  .route("/payment-methods")
  .post(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    StripeController.createPaymentMethod
  )
  .get(AuthenticationGuard, StripeController.listPaymentMethods);

router
  .route("/payment-methods/:id")
  .get(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    StripeController.retrievePaymentMethod
  )
  .delete(
    AuthenticationGuard,
    AccessGuard("marketplace"),
    StripeController.deletePaymentMethod
  );

export default router;
