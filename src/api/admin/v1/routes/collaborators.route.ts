import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminCollaboratorsController from '../controllers/collaborators.controller';

const router = express.Router();

router
  .route('/health-units/:healthUnit/collaborators')
  .post(
    AuthenticationGuard,
    ClientGuard('admin'),
    AdminCollaboratorsController.adminCreateCollaborator
  );

export default router;
