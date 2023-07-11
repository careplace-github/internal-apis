// Import the express module
import Router from 'express';
import express from 'express';

// Import controllers
import { CollaboratorsController } from '../../controllers';

import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import ClientGuard from '../../middlewares/guards/clientGuard.middleware';

const router = express.Router();

router
  .route('/collaborators')
  .get(AuthenticationGuard, ClientGuard('business'), CollaboratorsController.listCollaborators)
  .post(AuthenticationGuard, ClientGuard('business'), CollaboratorsController.create);

router
  .route('/collaborators/:id')
  .get(AuthenticationGuard, ClientGuard('business'), CollaboratorsController.retrieve)
  .put(AuthenticationGuard, ClientGuard('business'), CollaboratorsController.update)
  .delete(AuthenticationGuard, ClientGuard('business'), CollaboratorsController.delete);

export default router;
