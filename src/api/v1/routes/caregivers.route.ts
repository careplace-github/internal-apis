// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import { CaregiversController } from '../controllers';

const router = express.Router();

router
  .route('/caregivers')
  .get(AuthenticationGuard, ClientGuard('business'), CaregiversController.listCaregivers)
  .post(AuthenticationGuard, ClientGuard('business'), CaregiversController.createCaregiver);

router
  .route('/caregivers/:id')
  .get(AuthenticationGuard, ClientGuard('business'), CaregiversController.retrieveCaregiver)
  .put(AuthenticationGuard, ClientGuard('business'), CaregiversController.updateCaregiver)
  .delete(AuthenticationGuard, ClientGuard('business'), CaregiversController.deleteCaregiver);

export default router;
