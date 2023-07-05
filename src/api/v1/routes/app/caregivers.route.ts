// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { CaregiversController } from '../../controllers';

import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('health-units/caregivers')
  .get(AuthenticationGuard, AccessGuard('crm'), CaregiversController.listHealthUnitCaregivers)
  .post(AuthenticationGuard, AccessGuard('crm'), CaregiversController.createHealthUnitCaregiver);

router
  .route('health-units/caregivers/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), CaregiversController.retrieveHealthUnitCaregiver)
  .put(AuthenticationGuard, AccessGuard('crm'), CaregiversController.updateHealthUnitCaregiver)
  .delete(AuthenticationGuard, AccessGuard('crm'), CaregiversController.deleteHealthUnitCaregiver);

export default router;
