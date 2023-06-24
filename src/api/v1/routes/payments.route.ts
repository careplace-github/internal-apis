import express from 'express';

// Import Controller
import StripeController from '../controllers/stripe.controller';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/payments/coupons')
  .post(AuthenticationGuard, AccessGuard('marketplace'), StripeController.validateCoupon);

router
  .route('/payments/tokens/card')
  .post(AuthenticationGuard, AccessGuard('marketplace'), StripeController.createCardToken);

router
  .route('/payments/payment-methods')
  .post(AuthenticationGuard, AccessGuard('marketplace'), StripeController.createPaymentMethod)
  .get(AuthenticationGuard, AccessGuard('marketplace'), StripeController.listPaymentMethods);

router
  .route('/payments/payment-methods/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), StripeController.retrievePaymentMethod)
  .delete(AuthenticationGuard, AccessGuard('marketplace'), StripeController.deletePaymentMethod);

export default router;
