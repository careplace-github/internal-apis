import express from 'express';

import PatientsController from '../../controllers/patients.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/customers/patients')
  .post(AuthenticationGuard, AccessGuard('marketplace'), PatientsController.createCustomerPatient)
  .get(AuthenticationGuard, AccessGuard('marketplace'), PatientsController.listPatientsByCustomer);

router
  .route('/customers/patients/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), PatientsController.retrieveCustomerPatient)
  .put(AuthenticationGuard, AccessGuard('marketplace'), PatientsController.updateCustomerPatient)
  .delete(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    PatientsController.deleteCustomerPatient
  );

export default router;
