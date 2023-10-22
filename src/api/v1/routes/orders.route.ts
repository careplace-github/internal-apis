import express from 'express';

// Import Controller
import { AuthenticationGuard, ClientGuard, ValidatorMiddleware } from '@packages/middlewares';
import OrdersController from '../controllers/orders.controller';
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

router
  .route('/customers/orders/help')
  .post(ClientGuard('marketplace'), OrdersController.customerOrderHelp);

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
  .put(AuthenticationGuard, ClientGuard('business'), OrdersController.healthUnitUpdateHomeCareOrder)
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    OrdersController.healthUnitDeleteHomeCareOrder
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
