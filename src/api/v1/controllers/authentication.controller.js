// Import Cognito Service
import Cognito from "../services/cognito.service.js";

// Import database access objects
import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

import authHelper from "../helpers/auth.helper.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";

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

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      gender : req.body.gender,
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
      newUser.phoneNumber,
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
      mongodbResponse = await usersDAO.add(newUser);

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
  static async login(req, res, next) {
    // try {
    var request = requestUtils(req);

    logger.info(
      "Attempting to login the user: " + JSON.stringify(request, null, 2) + "\n"
    );

    let cognitoResponse = {};
    let response = {};

    const app = await authHelper.getUserApp(req.body.email);

    //console.log("app: ", app);

    var payload = { email: req.body.email, password: req.body.password };

    cognitoResponse = await Cognito.authenticateUser(
      app,
      "USER_PASSWORD_AUTH",
      payload
    );

    // If there is an error, return the error to the client
    if (cognitoResponse.error != null) {
      request.statusCode = 400;
      request.response = { error: cognitoResponse.error.message };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      return res.status(400).json({ error: cognitoResponse.error.message });
    }

    // User authenticated successfully
    else {
      logger.warn(JSON.stringify(cognitoResponse, null, 2) + "\n");

      // Check for challenges
      if (cognitoResponse.ChallengeName != null) {
        switch (cognitoResponse.ChallengeName) {
          case "NEW_PASSWORD_REQUIRED":
            response.challenge = cognitoResponse.ChallengeName;
            response.session = cognitoResponse.Session;

            const test = Cognito.getSession(app, req.body.email);

            break;

          default:
            response.hallenge = cognitoResponse.ChallengeName;
            response.challengeParameters = cognitoResponse.ChallengeParameters;

            break;
        }
      }

      // No challenges
      else {
       
          response.accessToken = cognitoResponse.AuthenticationResult.AccessToken;
          response.accessTokenExpiration = cognitoResponse.AuthenticationResult.ExpiresIn;
          response.accessTokenType = cognitoResponse.AuthenticationResult.TokenType;
          response.refreshToken = cognitoResponse.AuthenticationResult.RefreshToken;
      
      }

      // Fetch user information from the database
      const user = await usersDAO.get_one_by_email(req.body.email);
      response.user = user;

      /**
       *  // User information fetched successfully
      if (user) {
        // The role user is the only role not associated with a company
        if (user.role != "user") {
          // Fetch company information from the database
          const company = await companiesDAO.get_one(user.companyId);

          // Company information fetched successfully
          if (company) {
            user.company = company;
          }
        }
        // Populate the response with the user information
        response.user = user;
      }
       */

     

      request.statusCode = 200;
      request.response = response;

      logger.info(JSON.stringify(request, null, 2) + "\n");

      return res.status(200).json(response);
    }
  }

  /**
       *   } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
    }
       */

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
    try {
      var request = requestUtils(req);

      logger.info(
        "Attempting to confirm a Cognito user through the verification code sent to the user email: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const cognitoResponse = await Cognito.verifyAttribute(
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
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(JSON.stringify(request, null, 2) + "\n");

      return res.status(500).json({
        error: error,
      });
    }
  }
}
