// Import the express module
import Router from 'express';
import express from 'express';
import { AuthenticationGuard, ClientGuard } from 'src/packages/middlewares';
import CustomersController from '../controllers/customers.controller';

const router = express.Router();

router
  .route('/customers')
  .post(AuthenticationGuard, ClientGuard('business'), CustomersController.createHealthUnitCustomer)
  .get(AuthenticationGuard, ClientGuard('business'), CustomersController.listHealthUnitCustomers);
router
  .route('/customers/:id')
  .get(AuthenticationGuard, ClientGuard('business'), CustomersController.retrieveHealthUnitCustomer)
  .put(AuthenticationGuard, ClientGuard('business'), CustomersController.updateHealthUnitCustomer)
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    CustomersController.deleteHealthUnitCustomer
  );

export default router;
