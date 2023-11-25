import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminCaregiversController from '../controllers/caregivers.controller';

const router = express.Router();

router
  .route('/health-units/:healthUnit/caregivers')
  .post(AuthenticationGuard, ClientGuard('admin'), AdminCaregiversController.adminCreateCaregiver);

export default router;
