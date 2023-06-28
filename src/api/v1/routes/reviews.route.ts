import express from 'express';

import ReviewsController from '../controllers/reviews.controller';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/companies/:id/reviews')
  .post(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.create)
  .get(ReviewsController.getCompanyReviews);

router
  .route('/reviews/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.retrieve)
  .put(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.update);

router
  .route('/companies/:id/reviews/eligibility')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.checkEligibility);

router
  .route('/users/reviews')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.getUserReviews);

  router
  .route('/users/reviews/companies/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.getUserCompanyReview);


export default router;
