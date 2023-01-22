import express from "express";



// Import Controller
import StripeController from "../controllers/stripe.controller.js";

const router = express.Router();

router.route("/payment-methods")
  .post(StripeController.createPaymentMethod)
  .get(StripeController.listPaymentMethods);



router.route("/payment-methods/:id")
    .get(StripeController.retrievePaymentMethod)
    .delete(StripeController.deletePaymentMethod);




export default router;
