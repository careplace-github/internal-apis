import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminHealthUnitsController from '../controllers/health-units.controller';

const router = express.Router();

router
  .route('/health-units/:healthUnit/collaborators')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.createHealthUnitCollaborator
  );

export default router;
