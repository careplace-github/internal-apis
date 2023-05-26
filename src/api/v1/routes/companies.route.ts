// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import CompaniesController from '../controllers/companies.controller';
import OrdersController from '../controllers/orders.controller';
import UsersController from '../controllers/users.controller';
import StripeController from '../controllers/stripe.controller.js';
import DashboardController from '../controllers/dashboard.controller.js';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/companies/dashboard')
  .get(AuthenticationGuard, AccessGuard('crm'), DashboardController.getDashboard);

router.route('/companies/search').get(CompaniesController.searchCompanies);

router
  .route('/companies/orders')
  .get(AuthenticationGuard, AccessGuard('crm'), OrdersController.listOrdersByCompany);

router
  .route('/companies/users')
  .get(AuthenticationGuard, AccessGuard('crm'), UsersController.listUsersByCompany)
  .post(AuthenticationGuard, AccessGuard('crm'), UsersController.create);

router
  .route('/companies/users/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), UsersController.retrieve)
  .put(AuthenticationGuard, AccessGuard('crm'), UsersController.update)
  .delete(AuthenticationGuard, AccessGuard('crm'), UsersController.delete);

router
  .route('/companies/external-accounts')
  .post(AuthenticationGuard, AccessGuard('crm'), StripeController.createExternalAccount)
  .get(AuthenticationGuard, AccessGuard('crm'), StripeController.listExternalAccounts);

router
  .route('/companies/external-accounts/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), StripeController.retrieveExternalAccount)
  .delete(AuthenticationGuard, AccessGuard('crm'), StripeController.deleteExternalAccount);

router.route('/companies/:id').get(CompaniesController.retrieve);

router
  .route('/companies/:id/orders')
  .post(AuthenticationGuard, AccessGuard('marketplace'), OrdersController.create);

router
  .route('/companies/orders/:id/accept')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.acceptOrder);

router
  .route('/companies/orders/:id/decline')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.declineOrder);

router
  .route('/companies/orders/:id/send-quote')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.sendQuote);

router
  .route('/companies/orders/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), OrdersController.retrieve)
  .put(AuthenticationGuard, AccessGuard('crm'), OrdersController.update)
  .delete(AuthenticationGuard, AccessGuard('crm'), OrdersController.delete);

router
  .route('/companies/orders/:id/send-quote')
  .post(AuthenticationGuard, AccessGuard('crm'), OrdersController.sendQuote);

export default router;
