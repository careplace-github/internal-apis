// Import the express module
import express from 'express';

// Import Middlewares
import { AuthenticationGuard, ValidatorMiddleware, ClientGuard } from '@packages/middlewares';
import { AddEventValidator, UpdateEventValidator } from '@api/v1/validations/events.validator';

// Import Controller
import CalendarController from '../controllers/calendar.controller';

const router = express.Router();

// -------------------------------------------------- //
//                       EVENTS                       //
// -------------------------------------------------- //

router
  .route('/calendar/collaborators/events')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),

    CalendarController.listCollaboratorEvents
  )
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    AddEventValidator,
    ValidatorMiddleware,
    CalendarController.createCollaboratorEvent
  );

router
  .route('/calendar/collaborators/events/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    CalendarController.retrieveCollaboratorEvent
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    UpdateEventValidator,
    ValidatorMiddleware,
    CalendarController.updateCollaboratorEvent
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    CalendarController.deleteCollaboratorEvent
  );

// -------------------------------------------------- //
//                     EVENT SERIES                   //
// -------------------------------------------------- //

// EVENTS

router
  .route('/calendar/health-units/events')
  .get(AuthenticationGuard, ClientGuard('business'), CalendarController.listHealthUnitEvents)
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    AddEventValidator,
    ValidatorMiddleware,
    CalendarController.createHealthUnitEvent
  );

router
  .route('/calendar/health-units/events/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    CalendarController.retrieveHealthUnitEvent
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    UpdateEventValidator,
    ValidatorMiddleware,
    CalendarController.updateHealthUnitEvent
  )
  .delete(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    CalendarController.deleteHealthUnitEvent
  );

// EVENT SERIES

router
  .route('/calendar/health-units/event-series')
  .get(AuthenticationGuard, ClientGuard('business'), CalendarController.listHealthUnitEventSeries)
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    AddEventValidator,
    ValidatorMiddleware,
    CalendarController.createHealthUnitEventSeries
  );

router
  .route('/calendar/health-units/event-series/:id')
  .get(
    AuthenticationGuard,
    ClientGuard('business'),
    CalendarController.retrieveHealthUnitEventSeries
  )
  .put(
    AuthenticationGuard,
    ClientGuard('business'),
    ValidatorMiddleware,
    UpdateEventValidator,
    ValidatorMiddleware,
    CalendarController.updateHealthUnitEventSeries
  );

export default router;
