import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminReviewsController from '../controllers/reviews.controller';

const router = express.Router();

router
  .route('/health-units/:healthUnit/reviews')
  .get(AuthenticationGuard, ClientGuard('admin'), AdminReviewsController.getHealthUnitReviews)
  .post(AuthenticationGuard, ClientGuard('admin'), AdminReviewsController.createHealthUnitReview);

router
  .route('/health-units/:healthUnit/reviews/:reviewId')
  .get(AuthenticationGuard, ClientGuard('admin'), AdminReviewsController.retrieveHealthUnitReview)
  .put(AuthenticationGuard, ClientGuard('admin'), AdminReviewsController.updateHealthUnitReview)
  .delete(AuthenticationGuard, ClientGuard('admin'), AdminReviewsController.deleteHealthUnitReview);

export default router;
