import express from "express";
import AuthenticationController from "../controllers/authentication.controller.js";
import AuthenticationGuard from "../middlewares/guards/authenticationGuard.middleware.js";

const router = express.Router();

// -------------------------------------------------------------------------------------------- //
//                                      GENERAL AUTHENTICATION                                  //
// -------------------------------------------------------------------------------------------- //

router
  .route("/auth/logout")
  .post(AuthenticationGuard, AuthenticationController.logout);

router
  .route("/auth/change-password")
  .post(AuthenticationGuard, AuthenticationController.changePassword);

// -------------------------------------------------------------------------------------------- //
//                                      CRM AUTHENTICATION                                      //
// -------------------------------------------------------------------------------------------- //

router.route("/auth/crm/login").post(AuthenticationController.login);

router
  .route("/auth/crm/send/forgot-password-code")
  .post(AuthenticationController.sendForgotPasswordCode);

router
  .route("/auth/crm/verify/forgot-password-code")
  .post(AuthenticationController.verifyForgotPasswordCode);

// -------------------------------------------------------------------------------------------- //
//                                 MARKETPLACE AUTHENTICATION                                   //
// -------------------------------------------------------------------------------------------- //

router.route("/auth/marketplace/signup").post(AuthenticationController.signup);

router
  .route("/auth/marketplace/send/confirmation-code")
  .post(AuthenticationController.sendConfirmationCode);
router
  .route("/auth/marketplace/verify/confirmation-code")
  .post(AuthenticationController.verifyConfirmationCode);

router.route("/auth/marketplace/login").post(AuthenticationController.login);

router
  .route("/auth/marketplace/send/forgot-password-code")
  .post(AuthenticationController.sendForgotPasswordCode);
router
  .route("/auth/marketplace/verify/forgot-password-code")
  .post(AuthenticationController.verifyForgotPasswordCode);

export default router;
