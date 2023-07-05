// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import CompaniesController from '../../controllers/companies.controller';
import OrdersController from '../../controllers/orders.controller';
import collaboratorsController from '../../controllers/collaborators.controller';
import StripeController from '../../controllers/payments.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();
router.route('/companies/search').get(CompaniesController.searchCompanies);
router.route('/companies/:id').get(CompaniesController.retrieve);

router
  .route('/companies/dashboard')
  .get(AuthenticationGuard, AccessGuard('crm'), CompaniesController.getDashboard);

export default router;
