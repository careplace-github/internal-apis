// Import the express module
import express from "express";

// Import Controller
import StripeController from "../../controllers/hooks/stripeWebHook.controller.js";
const router = express.Router();

router
  .route("/webhooks/stripe/connect")
  .post(express.raw({ type: "application/json" }), StripeController.connect);

router.route("/webhooks/stripe/account").post(StripeController.account);

export default router;
