import express from 'express';

import ReviewsController from '../../controllers/reviews.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/companies/reviews/:id')
  .get(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.retrieveCompanyReview)
  .put(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.updateCompanyReview);

router
  .route('/companies/:company/reviews')
  .post(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.createCompanyReview)
  .get(ReviewsController.getCompanyReviews);

router
  .route('/companies/:company/reviews/eligibility')
  .get(
    AuthenticationGuard,
    AccessGuard('marketplace'),
    ReviewsController.checkCompanyReviewEligibility
  );

export default router;
