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
  .get(AuthenticationGuard, AccessGuard('business'), CollaboratorsController.listCollaborators)
  .post(AuthenticationGuard, AccessGuard('business'), CollaboratorsController.create);

router
  .route('health-units/collaborators/:id')
  .get(AuthenticationGuard, AccessGuard('business'), CollaboratorsController.retrieve)
  .put(AuthenticationGuard, AccessGuard('business'), CollaboratorsController.update)
  .delete(AuthenticationGuard, AccessGuard('business'), CollaboratorsController.delete);

export default router;
