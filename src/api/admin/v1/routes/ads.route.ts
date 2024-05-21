import express from 'express';
import { AuthenticationGuard, ClientGuard } from '@packages/middlewares';
import AdminAdsController from '../controllers/ads.controller';

const router = express.Router();

router
  .route('/ads')
  .post(AuthenticationGuard, ClientGuard('admin'), AdminAdsController.adminCreateAd)
  .get(AuthenticationGuard, ClientGuard('admin'), AdminAdsController.adminSearchAds);

router
  .route('/ads/:id')
  .get(AuthenticationGuard, ClientGuard('admin'), AdminAdsController.adminRetrieveAd)
  .put(AuthenticationGuard, ClientGuard('admin'), AdminAdsController.adminUpdateAd)
  .delete(AuthenticationGuard, ClientGuard('admin'), AdminAdsController.adminDeleteAd);

export default router;
