// Import Cognito Service
import cognito from "../services/cognito.service.js";

// Import database access objects
import usersDAO from "../db/users.dao.js";
import companiesDAO from "../db/companies.dao.js";

import logger from "../../../logs/logger.js";
import * as Error from "../helpers/errors/errors.helper.js";
import authHelper from "../helpers/auth/auth.helper.js";
import CRUD from "./crud.controller.js";
import authUtils from "../utils/auth/auth.utils.js";

/**
 * Create a new instance of the UsersDAO.
 */
const UsersDAO = new usersDAO();

/**
 * Create a new instance of the AuthHelper.
 */
const AuthHelper = new authHelper();

const Cognito = new cognito();

export default class AuthenticationController {
  /**
   * @description Creates a new user in Cognito and MongoDB
   */

  static async signup(req, res, next) {
    // try {

    var request = requestUtils(req);

    const app = "marketplace";

    logger.info(
      "Attempting to signup the user: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    let newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      phoneNumberCountryCode: req.body.phoneNumberCountryCode,
      gender: req.body.gender,
      cognitoId: "",
    };

    let cognitoResponse;
    let mongodbResponse;

    logger.info(
      "Attempting to create new user: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    cognitoResponse = await Cognito.addUser(
      app,
      newUser.email,
      newUser.password,
      newUser.phoneNumber
    );

    // If there is an error, return the error to the client
    if (cognitoResponse.error != null) {
      request.statusCode = 400;
      request.response = { error: cognitoResponse.error.message };

      logger.error(
        "Error adding a new Cognito user: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      return res.status(400).json({ error: cognitoResponse.error.message });
    }

    // A new user has been created in Cognito
    else {
      logger.info(
        "Successfully created a new Cognito user: " +
          JSON.stringify(cognitoResponse, null, 2) +
          "\n"
      );

      newUser.cognitoId = cognitoResponse.UserSub;

      // Attempting to add a new user to the database
      mongodbResponse = await UsersDAO.create(newUser);

      // If there is an error, return the error to the client
      if (mongodbResponse.error != null) {
        logger.error(
          "Error adding a new user to MongoDB: " + mongodbResponse.error + "\n"
        );

        request.statusCode = 400;
        request.response = { error: mongodbResponse.error };

        return res.status(400).json({ error: mongodbResponse.error });
      } else {
        // User has been added to MongoDB successfully
        logger.info(
          "Successfully created a new user in MongoDB: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );

        // Cognito.resendVerificationCode(newUser.email);

        request.statusCode = 200;
        request.response = {
          message: "User created successfully",
          user: mongodbResponse,
        };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        return res.status(200).json({
          message: "User created successfully",
          user: mongodbResponse,
        });
      }
    }

    /**
       *  } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
      }

       */
  }

  /**
   * @description Signs in a user
   */
  static async crm_login(req, res, next) {
    try {
      logger.info(
        `Authentication Controller CRM_LOGIN Request: \n ${JSON.stringify(
          req.body,
          null,
          2
        )}`
      );

      let response = {};
      let responseAux = {};

      let app = "crm;";
      let cognitoResponse = {};
      let Cognito = new cognito(app);

      var payload = { email: req.body.email, password: req.body.password };

      try {
        cognitoResponse = await Cognito.authenticateUser(
          app,
          "USER_PASSWORD_AUTH",
          payload
        );
      } catch (error) {
        /**
         * @todo Handle all exceptions
         * @see
         */
        switch (error.code) {
          case "UserNotFoundException":
            break;
          case "NotAuthorizedException":
            break;
          case "PasswordResetRequiredException":
            break;
          case "InvalidParameterException":
            break;
          case "InvalidPasswordException":
            break;
          case "UserNotConfirmedException":
            break;
          case "CodeMismatchException":
            break;
          case "ExpiredCodeException":
            break;
        }

        response.statusCode = 400;
        response.data = { error: error.message };

        next(response);
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
        console.log("cognitoResponse: " + cognitoResponse);

        responseAux.accessToken =
          cognitoResponse.AuthenticationResult.AccessToken;
        responseAux.accessTokenExpiration =
          cognitoResponse.AuthenticationResult.ExpiresIn;
        responseAux.accessTokenType =
          cognitoResponse.AuthenticationResult.TokenType;
        responseAux.refreshToken =
          cognitoResponse.AuthenticationResult.RefreshToken;
      }

 
   /**
    * 1) AUTHENTICATE USER -> GET ACCESS TOKEN
    * 2) GET COGNITO ID FROM ACCESS TOKEN USING AUTH HELPER -> RETRIEVE USER FROM MONGODB
    * 3) GET USER ROLES FROM USING REQ.BODY.EMAIL -> ADD TO USER OBJECT
    */


      let AuthUtils = new authUtils();

      let  decodedToken = await AuthUtils.decodeJwtToken( cognitoResponse.AuthenticationResult.AccessToken);

      let roles = decodedToken["cognito:groups"];
      let cognitoId = decodedToken.sub;

      console.log("cognitoId: " + JSON.stringify(cognitoId, null, 2));

      /**
       * @todo Implement with query_one instead of query_list
       *
       * Fetch user information from the database
       */
      let user = await UsersDAO.query_list({
        cognito_id: { $eq: cognitoId },
      });

     


      // Convert the user object to a JSON object
      user = JSON.parse(JSON.stringify(user));

       // Order each field alphabetically 
      user = Object.keys(user).sort().reduce((obj, key) => {
        obj[key] = user[key];
        return obj;
      }, {});
      

      // Remove the cognito_id from the user object
      delete user.cognito_id;
      delete user.cognitoId;

      // Add the user role to the user object
      user.roles = roles ? roles : ["crm-user"];

      responseAux.user = user;

      response.statusCode = 200;
      response.data = responseAux;

      next(response);



      

    } catch (error) {
      next(error);
    }
  }

  static async marketplace_login(req, res, next) {}

  /**
   * @description Changes a user's password
   */
  static async changePassword(req, res, next) {
    try {
      var request = requestUtils(req);

      logger.info(
        "Attempting to change the user password: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const token = req.headers.authorization.split(" ")[1];

      const cognitoResponse = await Cognito.changeUserPassword(
        token,
        req.body.oldPassword,
        req.body.newPassword
      );

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: cognitoResponse.error };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        return res.status(400).json({ error: cognitoResponse.error.message });
      }

      // If there is no error, return the success message to the client
      else {
        request.statusCode = 200;
        request.response = { message: "Password changed successfully" };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        return res.status(200).json({
          message: "Password changed successfully",
        });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.info(JSON.stringify(request, null, 2) + "\n");

      // return the error to the client
      return res.status(500).json({
        error: error,
      });
    }
  }

  /**
   * @description Logs out a user. Invalidates the user's token and refresh token.
   */
  static async logout(req, res, next) {
    const token = req.headers.authorization.split(" ")[1];

    var request = requestUtils(req);

    logger.info(
      "Attempting to logout the user: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );
    try {
      const cognitoResponse = await Cognito.logoutUser(token);

      if (cognitoResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: cognitoResponse.error.message };

        logger.error(JSON.stringify(request, null, 2) + "\n");

        return res.status(400).json({ error: cognitoResponse.error.message });
      }

      request.statusCode = 200;
      request.response = { message: "User logged out successfully" };

      logger.info(JSON.stringify(request, null, 2) + "\n");

      return res.status(200).json({
        message: "User logged out successfully",
      });
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      // return the error to the client
      return res.status(500).json({
        error: error,
      });
    }
  }

  /**
   * @description Sends a password reset code email to the user
   */
  static async sendForgotPasswordCode(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Attempting to send the forgot password code to the user: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    try {
      const cognitoResponse = await Cognito.sendForgotPasswordCode(
        "crm",
        req.body.email
      );

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: cognitoResponse.error };
        logger.error(JSON.stringify(request, null, 2) + "\n");
        return res.status(400).json({ error: cognitoResponse.error });
      } else {
        request.statusCode = 200;
        request.response = {
          message: "Password reset email sent successfully.",
        };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        // If there is no error, return the response to the client
        return res.status(200).json({
          message: "Password reset email sent successfully.",
        });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      // return the error to the client
      return res.status(500).json({
        error: error,
      });
    }
  }

  /**
   * @description Resets a user's password using the code sent to the user's email address and the new password passed in the request body
   */
  static async verifyForgotPasswordCode(req, res, next) {
    try {
      var request = requestUtils(req);

      logger.info(
        "Attempting to reset the user password with the code sent to the user's email: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const cognitoResponse = await Cognito.changeUserPasswordWithCode(
        "crm",
        req.body.email,
        req.body.code,
        req.body.newPassword
      );

      logger.debug(JSON.stringify(cognitoResponse, null, 2) + "\n");

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: cognitoResponse.error.message };

        logger.error(JSON.stringify(request, null, 2) + "\n");

        return res.status(400).json({
          error: cognitoResponse.error.message,
        });
      } else {
        request.statusCode = 200;
        request.response = { message: "Password reset successfully." };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        // If there is no error, return the response to the client
        return res.status(200).json({
          message: "Password reset successfully",
        });
      }
    } catch (e) {
      request.response = { error: e };
      request.statusCode = 500;

      logger.error(JSON.stringify(request, null, 2) + "\n");

      return res.status(500).json({
        error: e,
      });
    }
  }

  /**
   * @description Resends a verification code to the user's email address
   */
  static async resendVerificationCode(req, res, next) {
    try {
      var request = requestUtils(req);

      logger.info(
        "Attempting to resend the verification code to the user's email: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const cognitoResponse = await Cognito.resendVerificationCode(
        req.body.email
      );

      // If there is an error, return the error to the client
      if (cognitoResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: cognitoResponse.error };

        logger.error(JSON.stringify(request, null, 2) + "\n");

        return res.status(400).json({ error: cognitoResponse.error });
      } else {
        // If there is no error, return the response to the client
        request.statusCode = 200;
        request.response = {
          message: "Verification code resent successfully.",
        };

        logger.info(JSON.stringify(request, null, 2) + "\n");

        return res.status(200).json({
          message: "Verification code resent successfully.",
        });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      // return the error to the client
      return res.status(500).json({
        error: error,
      });
    }
  }

  /**
   * @description Verifies a congito user's email address using the code sent to the user's email address.
   */
  // Function to confirm the user's email address after registration using the confirmation code sent to the user's email address
  static async verifyUser(req, res, next) {
    var request = requestUtils(req);

    logger.info(
      "Attempting to confirm a Cognito user through the verification code sent to the user email: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );
    app = await AuthHelper.getUserApp(req.body.email);

    const cognitoResponse = await Cognito.confirmUser(
      app,
      req.body.email,
      req.body.code
    );

    // If there is an error, return the error to the client
    if (cognitoResponse.error != null) {
      request.statusCode = 400;
      request.response = { error: cognitoResponse.error };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      return res.status(400).json({ error: cognitoResponse.error.message });

      // If there is no error, return the success message to the client
    } else {
      request.statusCode = 200;
      request.response = {
        message: "User confirmed successfully.",
      };

      logger.info(JSON.stringify(request, null, 2) + "\n");

      return res.status(200).json({
        message: "User confirmed successfully.",
      });
    }
  }
}
