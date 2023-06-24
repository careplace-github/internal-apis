// Import the express module
import Router from 'express';
import express from 'express';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';

// Import controllers
import StripeController from '../controllers/stripe.controller';
const router = express.Router();

router
  .route('/checkout/orders/:id/payment-intent')
  .post(AuthenticationGuard, StripeController.createSubscriptionWithPaymentMethod);

export default router;
