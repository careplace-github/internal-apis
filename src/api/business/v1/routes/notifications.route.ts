import express from 'express';

// Import Controller
import NotificationsController from '../controllers/notifications.controller';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';

const router = express.Router();

router
  .route('/notifications/email/orders/home-care/:order/schedule-visit')
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    NotificationsController.sendHomeCareOrderScheduleVisitNotification
  );

router
  .route('/notifications/email/orders/home-care/:order/send-quote')
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    NotificationsController.sendHomeCareOrderQuoteNotification
  );

router
  .route('/notifications/email/orders/home-care/:order/send-update')
  .post(
    AuthenticationGuard,
    ClientGuard('business'),
    NotificationsController.sendHomeCareOrderUpdateNotification
  );

export default router;
