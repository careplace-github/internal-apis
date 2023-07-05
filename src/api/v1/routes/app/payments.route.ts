import express from 'express';

// Import Controller
import StripeController from '../../controllers/payments.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';
import InputValidation from '../../middlewares/validators/inputValidation.middleware';
import { CheckoutValidator } from '../../validators/payments.validator';

const router = express.Router();

router
  .route('/payments/promotion-code/eligibility')
  .post(AuthenticationGuard, AccessGuard('marketplace'), StripeController.validatePromotionCode);

router
  .route('/payments/customers/payment-methods')
  .post(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    StripeController.createCustomerPaymentMethod
  )
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    StripeController.listCustomerPaymentMethods
  );

router
  .route('/payments/customers/payment-methods/:id')
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    StripeController.retrieveCustomerPaymentMethod
  )
  .delete(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    StripeController.deleteCustomerPaymentMethod
  );

router
  .route('/payments/orders/:id/checkout')
  .post(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    CheckoutValidator,
    InputValidation,
    StripeController.createSubscriptionWithPaymentMethod
  );

export default router;
