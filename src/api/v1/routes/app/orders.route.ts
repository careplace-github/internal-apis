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
  .route('/companies/:company/orders/home-care')
  .post(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    OrdersController.customerCreateHomeCareOrder
  );

/**
 * Business
 */

router
  .route('/companies/orders/home-care')
  .get(AuthenticationGuard, AccessGuard('crm'), OrdersController.listCompanyHomeCareOrders)
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.companyCreateHomeCareOrder);

router
  .route('/companies/orders/home-care/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), OrdersController.companyRetrieveHomeCareOrder)
  .put(AuthenticationGuard, AccessGuard('crm'), OrdersController.companyUpdateHomeCareOrder);

router
  .route('/companies/orders/home-care/:id/accept')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.acceptHomeCareOrder);

router
  .route('/companies/orders/home-care/:id/decline')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.declineHomeCareOrder);

router
  .route('/companies/orders/home-care/:id/send-quote')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.sendHomeCareOrderQuote);

export default router;
