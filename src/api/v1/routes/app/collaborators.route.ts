// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { CollaboratorsController } from '../../controllers';

import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('health-units/collaborators')
  .get(AuthenticationGuard, AccessGuard('crm'), CollaboratorsController.listCollaborators)
  .post(AuthenticationGuard, AccessGuard('crm'), CollaboratorsController.create);

router
  .route('health-units/collaborators/:id')
  .get(AuthenticationGuard, AccessGuard('crm'), CollaboratorsController.retrieve)
  .put(AuthenticationGuard, AccessGuard('crm'), CollaboratorsController.update)
  .delete(AuthenticationGuard, AccessGuard('crm'), CollaboratorsController.delete);

export default router;
