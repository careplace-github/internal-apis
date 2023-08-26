import express from 'express';

// Import Controller
import PaymentsController from '../controllers/payments.controller';
import { OrdersController } from '../controllers';
import { AuthenticationGuard, ClientGuard, ValidatorMiddleware } from '@packages/middlewares';
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
  .route('/payments/orders/home-care/:order/subscription')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    CheckoutValidator,
    ValidatorMiddleware,
    PaymentsController.createSubscriptionWithPaymentMethod
  );

router
  .route('/payments/orders/home-care/:order/subscription/coupon')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PaymentsController.addSubscriptionCoupon);

router
  .route('/payments/orders/home-care/:order/subscription/payment-method')
  .put(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PaymentsController.updateSubscriptionPaymentMethod
  );

router
  .route('/payments/orders/home-care/:order/subscription/billing-details')
  .put(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.customerUpdateHomeCareOrderBillingDetails
  );

router
  .route('/payments/orders/home-care/:order/subscription/charge')
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
