// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import DashboardController from '../controllers/dashboard.controller';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';

const router = express.Router();

router
  .route('/dashboard/overview')
  .get(AuthenticationGuard, ClientGuard('business'), DashboardController.getOverview);

router
  .route('/dashboard/annual-billing')
  .get(AuthenticationGuard, ClientGuard('business'), DashboardController.getAnnualBilling);

export default router;
