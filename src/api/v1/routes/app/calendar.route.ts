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
    AccessGuard('crm'),

    CalendarController.listCollaboratorEvents
  )
  .post(
    AuthenticationGuard,
    AccessGuard('crm'),
    InputValidation,
    AddEventValidator,
    InputValidation,
    CalendarController.createCollaboratorEvent
  );

router
  .route('/calendar/collaborator/events/:id')
  .get(
    AuthenticationGuard,
    AccessGuard('crm'),
    InputValidation,
    CalendarController.retrieveCollaboratorEvent
  )
  .put(
    AuthenticationGuard,
    AccessGuard('crm'),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.updateCollaboratorEvent
  )
  .delete(
    AuthenticationGuard,
    AccessGuard('crm'),
    InputValidation,
    CalendarController.deleteCollaboratorEvent
  );

export default router;
