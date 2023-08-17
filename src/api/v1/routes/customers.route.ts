// Import the express module
import Router from 'express';
import express from 'express';
import CustomersController from '../controllers/customers.controller';
import { AuthenticationGuard, ClientGuard } from 'src/packages/middlewares';

const router = express.Router();

router
  .route('/health-units/customers')
  .post(AuthenticationGuard, ClientGuard('business'), CustomersController.createHealthUnitCustomer)
  .get(AuthenticationGuard, ClientGuard('business'), CustomersController.listHealthUnitCustomers);
router
  .route('/health-units/customers/:id')
  .get(AuthenticationGuard, ClientGuard('business'), CustomersController.retrieveHealthUnitCustomer)
  .put(AuthenticationGuard, ClientGuard('business'), CustomersController.updateHealthUnitCustomer)
  .delete(AuthenticationGuard, ClientGuard('business'), CustomersController.deleteHealthUnitCustomer);


export default router;
