// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { CaregiversController } from '../../controllers';

import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/companies/caregivers')
  .get(AuthenticationGuard, AccessGuard('crm'), CaregiversController.listCompanyCaregivers)
  .post(AuthenticationGuard, AccessGuard('crm'), CaregiversController.createCompanyCaregiver);

router
  .route('/companies/caregivers/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), CaregiversController.retrieveCompanyCaregiver)
  .put(AuthenticationGuard, AccessGuard('crm'), CaregiversController.updateCompanyCaregiver)
  .delete(AuthenticationGuard, AccessGuard('crm'), CaregiversController.deleteCompanyCaregiver);

export default router;
