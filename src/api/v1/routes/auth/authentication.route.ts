import express from 'express';
import AuthenticationController from '../../controllers/authentication.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';

const router = express.Router();

router.route('/auth/signup').post(AuthenticationController.signup);

router.route('/auth/send/confirmation-code').post(AuthenticationController.sendConfirmationCode);

router
  .route('/auth/verify/confirmation-code')
  .post(AuthenticationController.verifyConfirmationCode);


router
  .route('/auth/send/forgot-password-code')
  .post(AuthenticationController.sendForgotPasswordCode);
router
  .route('/auth/verify/forgot-password-code')
  .post(AuthenticationController.verifyForgotPasswordCode);

router.route('/auth/signin').post(AuthenticationController.signin);

router.route('/auth/account').get(AuthenticationGuard, AuthenticationController.getAccount);

router
  .route('/auth/change-password')
  .post(AuthenticationGuard, AuthenticationController.changePassword);

router.route('/auth/signout').post(AuthenticationGuard, AuthenticationController.signout);

export default router;
