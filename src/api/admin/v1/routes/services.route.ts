import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import ServicesController from '@api/v1/controllers/services.controller';

const router = express.Router();

router
  .route('/services')
  .get(AuthenticationGuard, ClientGuard('admin'), ServicesController.listServices);

export default router;
