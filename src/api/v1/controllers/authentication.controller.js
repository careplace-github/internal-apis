// Import Cognito Service
import cognito from "../services/cognito.service.js";

// Import database access objects
import crmUsersDAO from "../db/crmUsers.dao.js";
import marketplaceUsersDAO from "../db/marketplaceUsers.dao.js";
import companiesDAO from "../db/companies.dao.js";

import logger from "../../../logs/logger.js";
import * as Error from "../utils/errors/http/index.js";
import authHelper from "../helpers/auth/auth.helper.js";
import CRUD from "./crud.controller.js";
import authUtils from "../utils/auth/auth.utils.js";
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from "../../../config/constants/index.js";

export default class AuthenticationController {
  /**
   * @todo Debuging
   */
  static async signup(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let app;

      if (req.url === `/auth/marketplace/signup`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = "marketplace";
      } else {
        throw new Error._400("Invalid login request.");
      }

      Cognito = new cognito(clientId);

      let newUser = req.body;
      let cognitoResponse;
      let MarketplaceUsersDAO;

      let mongodbResponse;

      if (app === "marketplace") {
        MarketplaceUsersDAO = new marketplaceUsersDAO();
      }

      try {
        cognitoResponse = await Cognito.addUser(
          newUser.email,
          newUser.password,
          newUser.phone
        );
      } catch (err) {
        switch (err.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(err.message);

          default:
            throw new Error._500(err.message);
        }
      }

      let roles;
      try {
        roles = await Cognito.addUserToGroup(newUser.email, "marketplace-user");
      } catch (err) {
        console.log(err);
        switch (err.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(err.message);

          default:
            throw new Error._500(err.message);
        }
      }

      newUser.cognito_id = cognitoResponse.UserSub;
      newUser.roles = ["marketplace-user"];

      delete newUser.password;
      delete newUser.confirmPassword;

      try {
        // Attempting to add a new user to the database
        mongodbResponse = await MarketplaceUsersDAO.create(newUser);
      } catch (err) {
        switch (err.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(err.message);

          default:
            throw new Error._500(err.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        user: mongodbResponse,
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   *  @todo Debuging
   */
  static async sendConfirmationCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let app;

      if (req.url === `/auth/marketplace/send/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = "marketplace";
      } else {
        throw new Error._400("Invalid request.");
      }

      Cognito = new cognito(clientId);

      let cognitoResponse;

      try {
        cognitoResponse = await Cognito.sendConfirmationCode(req.body.email);
      } catch (error) {
        switch (error.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(error.message);

          case "NOT_FOUND":
            throw new Error._404(error.message);

          default:
            throw new Error._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: "Confirmation code sent successfully.",
      };

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   *  @todo Debuging
   */
  static async verifyConfirmationCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;
      let app;

      if (req.url === `/auth/marketplace/verify/confirmation-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = "marketplace";
      } else {
        throw new Error._400("Invalid request.");
      }

      Cognito = new cognito(clientId);

      let cognitoResponse;

      try {
        cognitoResponse = await Cognito.confirmUser(
          req.body.email,
          req.body.code
        );
      } catch (error) {
        switch (error.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(error.message);

          case "NOT_FOUND":
            throw new Error._404(error.message);

          default:
            throw new Error._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message:
          "Confirmation code verified successfully. User is now active and able to login.",
      };

      next(response);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  /**
   * Login a user
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async login(req, res, next) {
    try {
      logger.info(
        `Authentication Controller LOGIN Request: \n ${JSON.stringify(
          req.body,
          null,
          2
        )}`
      );

      let response = {};
      let responseAux = {};
      let clientId;
      let app;
      let cognitoResponse = {};

      /**
       * Check if the login request if for the CRM or the Marketplace by checking the url
       */

      if (req.url === `/auth/crm/login`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
        app = "crm";
      } else if (req.url === `/auth/marketplace/login`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        app = "marketplace";
      } else {
        throw new Error._400("Invalid login request.");
      }

      let Cognito = new cognito(clientId);

      var payload = { email: req.body.email, password: req.body.password };

      try {
        cognitoResponse = await Cognito.authenticateUser(
          "USER_PASSWORD_AUTH",
          payload
        );
      } catch (error) {
        logger.error(
          `Authentication Controller LOGIN Error: \n ${JSON.stringify(
            error,
            null,
            2
          )}`
        );
        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User does not exist.");

          case "UNAUTHORIZED":
            throw new Error._401(error.message);

          default:
            throw new Error._500(error.message);
        }
      }

      // User authenticated successfully

      // Check for challenges
      if (cognitoResponse.ChallengeName != null) {
        switch (cognitoResponse.ChallengeName) {
          case "NEW_PASSWORD_REQUIRED":
            /**
             * @todo
             */
            break;
        }
      }

      // No challenges
      else {
        responseAux.accessToken =
          cognitoResponse.AuthenticationResult.AccessToken;
        responseAux.accessTokenExpiration =
          cognitoResponse.AuthenticationResult.ExpiresIn;
        responseAux.accessTokenType =
          cognitoResponse.AuthenticationResult.TokenType;
        responseAux.refreshToken =
          cognitoResponse.AuthenticationResult.RefreshToken;
      }

      let AuthUtils = new authUtils();

      let decodedToken = await AuthUtils.decodeJwtToken(
        cognitoResponse.AuthenticationResult.AccessToken
      );

      let roles = decodedToken["cognito:groups"];
      let cognitoId = decodedToken.sub;
      let user;

      if (app === "crm") {
        let CrmUsersDAO = new crmUsersDAO();

        try {
          user = await CrmUsersDAO.query_one({
            cognito_id: { $eq: cognitoId },
          });
        } catch (error) {
          switch (error.type) {
            case "NOT_FOUND":
              throw new Error._404("User does not exist.");

            default:
              throw new Error._500(error.message);
          }
        }
      } else if (app === "marketplace") {
        let MarketplaceUsersDAO = new marketplaceUsersDAO();
        try {
          user = await MarketplaceUsersDAO.query_one({
            cognito_id: { $eq: cognitoId },
          });
        } catch (error) {
          switch (error.type) {
            case "NOT_FOUND":
              throw new Error._404("User does not exist.");
            default:
              throw new Error._500(error.message);
          }
        }
      }

      // Convert the user object to a JSON object
      user = JSON.parse(JSON.stringify(user));

      // Remove the cognito_id from the user object
      delete user.cognito_id;

      // Add the user role to the user object
      user.roles = roles ? roles : [];

      responseAux.user = user;

      response.statusCode = 200;
      response.data = responseAux;

      next(response);
    } catch (error) {
      logger.error(`Authentication Controller LOGIN Error: \n ${error.stack}`);
      next(error);
    }
  }

  /**
   * Changes a user password.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   * @throws {Error._401} - Token has expired.
   * @throws {Error._400} - Attempt limit exceeded.
   */
  static async changePassword(req, res, next) {
    try {
      let response = {};
      let accessToken;

      let cognitoResponse;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("Missing required authorization token.");
      }

      let Cognito = new cognito(accessToken);

      try {
        cognitoResponse = await Cognito.changeUserPassword(
          accessToken,
          req.body.oldPassword,
          req.body.newPassword
        );
      } catch (error) {
        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User does not exist.");

          case "UNAUTHORIZED":
            throw new Error._401(error.message);

          case "ATTEMPT_LIMIT":
            throw new Error._400(error.message);

          default:
            throw new Error._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: "Password changed successfully",
      };

      next(response);
    } catch (error) {
      logger.error(
        `Authentication Controller CHANGE_PASSWORD Internal Error: \n ${error.stack}`
      );
      next(error);
    }
  }

  /**
   * Logout a user.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   * @throws {Error._401} - Token has expired.
   */
  static async logout(req, res, next) {
    try {
      let token;
      let response = {};

      let Cognito = new cognito();

      if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      try {
        const cognitoResponse = await Cognito.logoutUser(token);
      } catch (error) {
        logger.error(
          `Authentication Controller LOGOUT Error: \n ${JSON.stringify(
            error,
            null,
            2
          )}`
        );

        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User does not exist.");

          case "UNAUTHORIZED":
            throw new Error._401("Token has expired.");

            case "INVALID_PARAMETER":
              throw new Error._400("Invalid access token.");

          default:
            throw new Error._500("Internal server error.");
        }
      }

      response.statusCode = 200;
      response.data = { message: "User logged out successfully" };

      next(response);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }

  /**
   * Sends a code to the user to reset their password.
   * For the Marketplace users the code is sent to the user's phone.
   * For the CRM users the code is sent to the user's email.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   */
  static async sendForgotPasswordCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;

      if (req.url === `/auth/crm/send/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/send/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        throw new Error._400("Invalid login request.");
      }

      Cognito = new cognito(clientId);

      try {
        const cognitoResponse = await Cognito.sendForgotPasswordCode(
          req.body.email
        );
      } catch (error) {
        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User not found");

          default:
            throw new Error._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = {
        message: "Password reset code sent successfully",
      };

      next(response);
    } catch (error) {
      logger.error(
        `Authentication Controller SEND_FORGOT_PASSWORD_CODE Error: \n ${error.stack}`
      );
      next(error);
    }
  }

  /**
   * Verifies the code sent to the user to reset their password.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   * @throws {Error._400} - User not found.
   */
  static async verifyForgotPasswordCode(req, res, next) {
    try {
      let response = {};

      let clientId;
      let Cognito;

      if (req.url === `/auth/crm/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_CRM_CLIENT_ID;
      } else if (req.url === `/auth/marketplace/verify/forgot-password-code`) {
        clientId = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
      } else {
        throw new Error._400("Invalid login request.");
      }

      Cognito = new cognito(clientId);

      try {
        const cognitoResponse = await Cognito.changeUserPasswordWithCode(
          req.body.email,
          req.body.code,
          req.body.newPassword
        );
      } catch (error) {
        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User not found");

          case "INVALID_CODE":
            throw new Error._400("Invalid code. Please request a new code.");

          default:
            throw new Error._500(error.message);
        }
      }

      response.statusCode = 200;
      response.data = { message: "Password reseted successfully." };

      next(response);
    } catch (error) {
      logger.error(
        `Authentication Controller SEND_FORGOT_PASSWORD_CODE Error: \n ${error.stack}`
      );
      next(error);
    }
  }
}
