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

router
  .route('/auth/account')
  .get(AuthenticationGuard, AuthenticationController.getAccount)
  .put(AuthenticationGuard, AuthenticationController.updateAccount);

router
  .route('/auth/account/change-email')
  .post(AuthenticationGuard, AuthenticationController.changeEmail);

router
  .route('/auth/account/change-phone')
  .post(AuthenticationGuard, AuthenticationController.changePhone);

router
  .route('/auth/send/confirm-phone-code')
  .post(AuthenticationGuard, AuthenticationController.sendConfirmPhoneCode);

router
  .route('/auth/verify/confirm-phone-code')
  .post(AuthenticationGuard, AuthenticationController.verifyConfirmPhoneCode);

router
  .route('/auth/send/confirm-email-code')
  .post(AuthenticationGuard, AuthenticationController.sendConfirmEmailCode);

router
  .route('/auth/verify/confirm-email-code')
  .post(AuthenticationGuard, AuthenticationController.verifyConfirmEmailCode);

router
  .route('/auth/change-password')
  .post(AuthenticationGuard, AuthenticationController.changePassword);

router.route('/auth/signout').post(AuthenticationGuard, AuthenticationController.signout);

export default router;
