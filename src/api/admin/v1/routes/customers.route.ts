import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminCustomersController from '../controllers/customers.controller';

const router = express.Router();

router
  .route('/customers')
  .post(AuthenticationGuard, ClientGuard('admin'), AdminCustomersController.adminCreateCustomer);
router
  .route('/customers/:id')
  .put(AuthenticationGuard, ClientGuard('admin'), AdminCustomersController.adminUpdateCustomer);

export default router;
