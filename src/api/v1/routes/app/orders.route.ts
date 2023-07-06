import express from 'express';

// Import Controller
import OrdersController from '../../controllers/orders.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';
import InputValidation from '../../middlewares/validators/inputValidation.middleware';
import { CheckoutValidator } from '../../validators/payments.validator';

const router = express.Router();

/**
 * Marketplace
 */

router
  .route('/customers/orders/home-care')
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    OrdersController.listCustomerHomeCareOrders
  );

router
  .route('/customers/orders/home-care/:id')
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    OrdersController.retrieveCustomerHomeCareOrder
  );

router
  .route('health-units/:health-unit/orders/home-care')
  .post(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    OrdersController.customerCreateHomeCareOrder
  );

/**
 * Business
 */

router
  .route('health-units/orders/home-care')
  .get(AuthenticationGuard, AccessGuard('business'), OrdersController.listHealthUnitHomeCareOrders)
  .post(AuthenticationGuard, AccessGuard('business'), OrdersController.healthUnitCreateHomeCareOrder);

router
  .route('health-units/orders/home-care/:id')
  .get(AuthenticationGuard, AccessGuard('business'), OrdersController.healthUnitRetrieveHomeCareOrder)
  .put(AuthenticationGuard, AccessGuard('business'), OrdersController.healthUnitUpdateHomeCareOrder);

router
  .route('health-units/orders/home-care/:id/accept')
  .post(AuthenticationGuard, AccessGuard('business'), OrdersController.acceptHomeCareOrder);

router
  .route('health-units/orders/home-care/:id/decline')
  .post(AuthenticationGuard, AccessGuard('business'), OrdersController.declineHomeCareOrder);

router
  .route('health-units/orders/home-care/:id/send-quote')
  .post(AuthenticationGuard, AccessGuard('business'), OrdersController.sendHomeCareOrderQuote);

export default router;
