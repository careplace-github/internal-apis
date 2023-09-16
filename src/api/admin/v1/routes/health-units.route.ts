import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminHealthUnitsController from '../controllers/health-units.controller';
import HealthUnitsController from '@api/v1/controllers/health-units.controller';

const router = express.Router();

router
  .route('/health-units')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.adminCreateHealthUnit
  );

router
  .route('/health-units/search')
  .get(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.adminSearchHealthUnits
  );

router
  .route('/health-units/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.adminRetrieveHealthUnit
  )
  .put(AuthenticationGuard, ClientGuard('admin'), AdminHealthUnitsController.adminUpdateHealthUnit)
  .delete(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.adminDeleteHealthUnit
  );

export default router;
