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
  .get(AuthenticationGuard, AccessGuard('business'), CaregiversController.listHealthUnitCaregivers)
  .post(AuthenticationGuard, AccessGuard('business'), CaregiversController.createHealthUnitCaregiver);

router
  .route('health-units/caregivers/:id')
  .get(AuthenticationGuard, AccessGuard('business'), CaregiversController.retrieveHealthUnitCaregiver)
  .put(AuthenticationGuard, AccessGuard('business'), CaregiversController.updateHealthUnitCaregiver)
  .delete(AuthenticationGuard, AccessGuard('business'), CaregiversController.deleteHealthUnitCaregiver);

export default router;
