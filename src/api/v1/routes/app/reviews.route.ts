import express from 'express';

import ReviewsController from '../../controllers/reviews.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/health-units/reviews/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.retrieveHealthUnitReview)
  .put(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.updateHealthUnitReview);

router
  .route('/health-units/:health-unit/reviews')
  .post(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.createHealthUnitReview)
  .get(ReviewsController.getHealthUnitReviews);

router
  .route('/health-units/:health-unit/reviews/eligibility')
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    ReviewsController.checkHealthUnitReviewEligibility
  );

export default router;
