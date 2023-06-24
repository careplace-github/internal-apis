import express from 'express';

import ReviewsController from '../controllers/reviews.controller';
import AuthenticationGuard from '../middlewares/guards/authenticationGuard.middleware';
import AccessGuard from '../middlewares/guards/accessGuard.middleware';

const router = express.Router();

router
  .route('/reviews/orders/:id')
  .post(AuthenticationGuard, AccessGuard('marketplace'), ReviewsController.create)

router
  .route('/reviews/companies/:id')
  .get(ReviewsController.listCompanyReviews);


export default router;
