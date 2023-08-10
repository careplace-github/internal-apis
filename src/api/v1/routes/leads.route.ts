// Import the express module
import express from 'express';

// Import Middlewares
import { AuthenticationGuard, ValidatorMiddleware, ClientGuard } from '@packages/middlewares';
import { AddEventValidator, UpdateEventValidator } from '@api/v1/validations/events.validator';

// Import Controller
import LeadsController from '../controllers/leads.controller';

const router = express.Router();

router
  .route('/leads/caregiver')
  .post(ClientGuard('marketplace'), LeadsController.createCaregiverLead);

router
  .route('/leads/health-unit')
  .post(ClientGuard('business'), LeadsController.createHealthUnitLead);

router
  .route('/leads/newsletter/customer')
  .post(ClientGuard('marketplace'), LeadsController.createCustomerNewsletterLead);

export default router;
