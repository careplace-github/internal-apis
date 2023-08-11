import express from 'express';
import AdminHealthUnitsController from '../controllers/health-units.controller';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';

const router = express.Router();

router
  .route('/health-units/:healthUnit/collaborators')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminHealthUnitsController.createHealthUnitCollaborator
  );

export default router;
