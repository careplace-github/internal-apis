import express from "express";
import AuthenticationController from "../controllers/authentication.controller.js";

const router = express.Router();

// -------------------------------------------------------------------------------------------- //
//                                      GENERAL AUTHENTICATION                                  //
// -------------------------------------------------------------------------------------------- //

router
  /**
   * @openapi
   * /auth/signup:
   *  post:
   *   tags:
   *   - Authentication
   *  summary: Signup
   * description: Signup
   * operationId: signup
   * requestBody:
   *  content:
   *  application/json:
   *  schema:
   *  $ref: '#/components/schemas/Signup'
   * responses:
   * 200:
   * description: Signup successful
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/SignupResponse'
   * 400:
   * description: Bad request
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ErrorResponse'
   * 401:
   * description: Unauthorized
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ErrorResponse'
   * 403:
   * description: Forbidden
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ErrorResponse'
   * 404:
   * description: Not found
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ErrorResponse'
   * 500:
   * description: Internal server error
   * content:
   * application/json:
   * schema:
   * $ref: '#/components/schemas/ErrorResponse'
   */
  .route("/auth/logout")
  .post(AuthenticationController.logout);

router
  .route("/auth/change-password")
  .post(AuthenticationController.changePassword);

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
