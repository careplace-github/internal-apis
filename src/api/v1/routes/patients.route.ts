import express from 'express';

import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import PatientsController from '../controllers/patients.controller';

const router = express.Router();

router
  .route('/customers/patients')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.createCustomerPatient)
  .get(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.listCustomerPatients);

router
  .route('/customers/patients/:id')
  .get(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.retrieveCustomerPatient)
  .put(AuthenticationGuard, PatientsController.updateCustomerPatient)
  .delete(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PatientsController.deleteCustomerPatient
  );

router
  .route('/health-units/patients')
  .post(AuthenticationGuard, ClientGuard('business'), PatientsController.createHealthUnitPatient)
  .get(AuthenticationGuard, ClientGuard('business'), PatientsController.listHealthUnitPatients);

router
  .route('/health-units/patients/:id')
  .get(AuthenticationGuard, ClientGuard('business'), PatientsController.retrieveHealthUnitPatient)
  .put(AuthenticationGuard, ClientGuard('business'), PatientsController.updateHealthUnitPatient)
  .delete(AuthenticationGuard, ClientGuard('business'), PatientsController.deleteHealthUnitPatient);

export default router;
