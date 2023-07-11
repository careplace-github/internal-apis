// Import the express module
import express from 'express';

// Import Middlewares
import InputValidation from '../../middlewares/validators/inputValidation.middleware';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import { AddEventValidator, UpdateEventValidator } from '../../validations/events.validator';

// Import Controller
import CalendarController from '../../controllers/calendar.controller';
import ClientGuard from '../../middlewares/guards/clientGuard.middleware';

const router = express.Router();

// -------------------------------------------------- //
//                       EVENTS                       //
// -------------------------------------------------- //

router
  .route('/calendar/collaborator/events')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),

    CalendarController.listCollaboratorEvents
  )
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    AddEventValidator,
    InputValidation,
    CalendarController.createCollaboratorEvent
  );

router
  .route('/calendar/collaborator/events/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    CalendarController.retrieveCollaboratorEvent
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.updateCollaboratorEvent
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    CalendarController.deleteCollaboratorEvent
  );

// -------------------------------------------------- //
//                     EVENT SERIES                   //
// -------------------------------------------------- //

// EVENTS

router
  .route('/calendar/health-unit/events')
  .get(AuthenticationGuard, ClientGuard('business'), CalendarController.listHealthUnitEvents)
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    AddEventValidator,
    InputValidation,
    CalendarController.createHealthUnitEvent
  );

router
  .route('/calendar/health-unit/events/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    CalendarController.retrieveHealthUnitEvent
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.updateHealthUnitEvent
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    CalendarController.deleteHealthUnitEvent
  );

// EVENT SERIES

router
  .route('/calendar/health-unit/event-series/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    CalendarController.retrieveHealthUnitEventSeries
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    InputValidation,
    UpdateEventValidator,
    InputValidation,
    CalendarController.updateHealthUnitEventSeries
  );

export default router;
