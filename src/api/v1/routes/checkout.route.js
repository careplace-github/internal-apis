// Import the express module
import Router from "express";
import express from "express";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";



// Import controllers
import StripeController from "../controllers/stripe.controller.js";
const router = express.Router();



router
  .route("/checkout/orders/:id/payment-intent")
  .post(AuthenticationGuard, StripeController.createSubscriptionPaymentIntent);



export default router;
