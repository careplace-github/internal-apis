import express from 'express';

import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import ReviewsController from '../controllers/reviews.controller';

const router = express.Router();

router
  .route('/health-units/:healthUnit/reviews/eligibility')
  .get(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    ReviewsController.checkHealthUnitReviewEligibility
  );

router
  .route('/customers/health-units/reviews')
  .get(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    ReviewsController.getCustomerHealthUnitReviewReviews
  );

router
  .route('/customers/health-units/:healthUnit/reviews')
  .get(
    AuthenticationGuard,
    ClientGuard('marketplace'),
    ReviewsController.getCustomerHealthUnitReview
  );

router
  .route('/health-units/:healthUnit/reviews')
  .post(AuthenticationGuard, ClientGuard('marketplace'), ReviewsController.createHealthUnitReview)
  .get(ReviewsController.getHealthUnitReviews);

router
  .route('/health-units/reviews/:id')
  .get(AuthenticationGuard, ClientGuard('marketplace'), ReviewsController.retrieveHealthUnitReview)
  .put(AuthenticationGuard, ClientGuard('marketplace'), ReviewsController.updateHealthUnitReview);

export default router;
