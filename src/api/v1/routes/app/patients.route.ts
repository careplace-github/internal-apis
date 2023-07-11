import express from 'express';

import PatientsController from '../../controllers/patients.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import ClientGuard from '../../middlewares/guards/clientGuard.middleware';

const router = express.Router();

router
  .route('/customers/patients')
  .post(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.createCustomerPatient)
  .get(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.listCustomerPatients);

router
  .route('/customers/patients/:id')
  .get(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.retrieveCustomerPatient)
  .put(AuthenticationGuard, ClientGuard('marketplace'), PatientsController.updateCustomerPatient)
  .delete(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    PatientsController.deleteCustomerPatient
  );

export default router;
