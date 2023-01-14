import express from "express";
import AuthenticationController from "../controllers/authentication.controller.js";




const router = express.Router();


router.route("/auth/signup").post(AuthenticationController.signup);


router.route("/auth/login").post(AuthenticationController.login);

router
  .route("/auth/change-password")
  .post( AuthenticationController.changePassword);

router
  .route("/auth/logout")
  .post( AuthenticationController.logout);

router
  .route("/auth/forgot-password")
  .post(AuthenticationController.sendForgotPasswordCode);

// Resend code routes

router
  .route("/auth/resend/verification-code")
  .post(AuthenticationController.resendVerificationCode);

router
  .route("/auth/resend/forgot-password-code")
  .post(AuthenticationController.sendForgotPasswordCode);

// Verification Routes

router.route("/auth/verify/user").post(AuthenticationController.verifyUser);

router.route("/auth/verify/forgot-password")
  .post(AuthenticationController.verifyForgotPasswordCode);

export default router;
