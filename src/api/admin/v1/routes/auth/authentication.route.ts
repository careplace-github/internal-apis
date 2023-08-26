import express from 'express';
import AdminAuthenticationController from '../../controllers/auth/authentication.controller';
import AuthenticationGuard from '@packages/middlewares/guards/authentication-guard.middleware';

const router = express.Router();

router.route('/auth/signin').post(AdminAuthenticationController.signin);

router
  .route('/auth/change-password')
  .post(AuthenticationGuard, AdminAuthenticationController.changePassword);

router.route('/auth/signout').post(AuthenticationGuard, AdminAuthenticationController.signout);

export default router;
