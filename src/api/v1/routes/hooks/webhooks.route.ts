// Import the express module
import express from "express";

// Import Controller
import StripeWebhooksController from "../../controllers/hooks/stripeWebHook.controller";
const router = express.Router();

router
  .route("/webhooks/stripe/connect")
  .post(
    express.raw({ type: "application/json" }),
    StripeWebhooksController.connect
  );

router.route("/webhooks/stripe/account").post(StripeWebhooksController.account);

export default router;
