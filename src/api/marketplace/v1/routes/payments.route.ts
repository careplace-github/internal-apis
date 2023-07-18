import express from 'express';

// Import Controller
import PaymentsController from '../controllers/payments.controller';
import {AuthenticationGuard, ClientGuard, ValidatorMiddleware} from '@packages/middlewares';
import { CheckoutValidator } from '../validations/payments.validator';

const router = express.Router();

// Promotion Codes

router
  .route('/payments/promotion-code/eligibility')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.validatePromotionCode);

// Payment Methods

router
  .route('/payments/payment-methods')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.createPaymentMethod)
  .get(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.listPaymentMethods);

router
  .route('/payments/payment-methods/:paymentMethod')
  .get(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.retrievePaymentMethod)
  .delete(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.deletePaymentMethod);

// Subscriptions

router
  .route('/payments/orders/:order/subscription')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    CheckoutValidator,
    ValidatorMiddleware,
    PaymentsController.createSubscriptionWithPaymentMethod
  );

router
  .route('/payments/orders/:order/subscription/coupon')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PaymentsController.addSubscriptionCoupon
  );

router
  .route('/payments/orders/:order/subscription/payment-method')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PaymentsController.updateSubscriptionPaymentMethod
  );

router
  .route('/payments/orders/:order/subscription/charge')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PaymentsController.chargeSubscriptionOpenInvoice
  );

// Tokens
router
  .route('/payments/tokens/card')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.createCardToken);

export default router;
