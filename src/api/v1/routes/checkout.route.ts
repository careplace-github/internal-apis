// Import the express module
import Router from 'express';
import express from 'express';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import InputValidation from '../middlewares/validators/inputValidation.middleware';
import { CheckoutValidator } from '../validators/payments.validator';

// Import controllers
import StripeController from '../controllers/stripe.controller';
const router = express.Router();

router.route('/checkout/orders/:id/payment-intent').post(
  AuthenticationGuard,
  AccessGuard('marketplace'),
  CheckoutValidator,
  InputValidation,

  StripeController.createSubscriptionWithPaymentMethod
);

export default router;
