import express from 'express';

// Import Controller
import StripeController from '../controllers/stripe.controller';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/users/payment-methods')
  .post(AuthenticationGuard, AccessGuard('marketplace'), StripeController.createPaymentMethod)
  .get(AuthenticationGuard, AccessGuard('marketplace'), StripeController.listPaymentMethods);

router
  .route('/users/payment-methods/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), StripeController.retrievePaymentMethod)
  .delete(AuthenticationGuard, AccessGuard('marketplace'), StripeController.deletePaymentMethod);

export default router;
