// Import the express module
import express from 'express';

// Import Middlewares
import InputValidation from '../../middlewares/validators/inputValidation.middleware';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import { AddEventValidator, UpdateEventValidator } from '../../validators/events.validator';

// Import Controller
import CalendarController from '../../controllers/calendar.controller';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/calendar/collaborator/events')
  .get(
    AuthenticationGuard,
    AccessGuard('business'),

    CalendarController.listCollaboratorEvents
  )
  .post(
    AuthenticationGuard,
    AccessGuard('business'),
    InputValidation,
    AddEventValidator,
    InputValidation,
    CalendarController.createCollaboratorEvent
  );

router
  .route('/calendar/collaborator/events/:id')
  .get(
    AuthenticationGuard,
    AccessGuard('business'),
    InputValidation,
    CalendarController.retrieveCollaboratorEvent
  )
  .put(
    AuthenticationGuard,
    AccessGuard('business'),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.updateCollaboratorEvent
  )
  .delete(
    AuthenticationGuard,
    AccessGuard('business'),
    InputValidation,
    CalendarController.deleteCollaboratorEvent
  );

export default router;
