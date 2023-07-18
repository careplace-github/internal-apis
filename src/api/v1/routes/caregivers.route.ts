// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { CaregiversController } from '../controllers';

import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';

const router = express.Router();

router
  .route('/health-units/caregivers')
  .get(AuthenticationGuard, ClientGuard('business'), CaregiversController.listCaregivers)
  .post(AuthenticationGuard, ClientGuard('business'), CaregiversController.createCaregiver);

router
  .route('/health-units/caregivers/:id')
  .get(AuthenticationGuard, ClientGuard('business'), CaregiversController.retrieveCaregiver)
  .put(AuthenticationGuard, ClientGuard('business'), CaregiversController.updateCaregiver)
  .delete(AuthenticationGuard, ClientGuard('business'), CaregiversController.deleteCaregiver);

export default router;
