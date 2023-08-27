import express from 'express';

// Import Controller
import OrdersController from '../controllers/orders.controller';
import { AuthenticationGuard, ClientGuard, ValidatorMiddleware } from '@packages/middlewares';
import { CheckoutValidator } from '../validations/payments.validator';

const router = express.Router();

/**
 * Marketplace
 */

router
  .route('/customers/orders/home-care')
  .get(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.listCustomerHomeCareOrders
  );

router
  .route('/customers/orders/home-care/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.retrieveCustomerHomeCareOrder
  )
  .put(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.customerUpdateHomeCareOrder
  );

router
  .route('/customers/orders/home-care/:id/cancel')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.customerCancelHomeCareOrder
  );

router
  .route('/customers/orders/home-care')
  .post(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    OrdersController.customerCreateHomeCareOrder
  );

/**
 * Business
 */

router
  .route('/health-units/orders/home-care')
  .get(AuthenticationGuard, ClientGuard('business'), OrdersController.listHealthUnitHomeCareOrders)
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    OrdersController.healthUnitCreateHomeCareOrder
  );

router
  .route('/health-units/orders/home-care/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    OrdersController.healthUnitRetrieveHomeCareOrder
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    OrdersController.healthUnitUpdateHomeCareOrder
  );

router
  .route('/health-units/orders/home-care/:id/accept')
  .post(AuthenticationGuard, ClientGuard('business'), OrdersController.acceptHomeCareOrder);

router
  .route('/health-units/orders/home-care/:id/decline')
  .post(AuthenticationGuard, ClientGuard('business'), OrdersController.declineHomeCareOrder);

router
  .route('/health-units/orders/home-care/:id/send-quote')
  .post(AuthenticationGuard, ClientGuard('business'), OrdersController.sendHomeCareOrderQuote);

  router
  .route('/health-units/orders/home-care/:id/schedule-visit')
  .post(AuthenticationGuard, ClientGuard('business'), OrdersController.scheduleHomeCareOrderVisit);

export default router;
