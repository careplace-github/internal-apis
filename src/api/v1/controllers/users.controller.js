import password from "secure-random-password";
import CognitoService from "../services/cognito.service.js";

import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

import AuthHelper from "../helpers/auth.helper.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";

export default class UsersController {
  /**
   * @debug
   * @description
   */
  static async createUser(req, res, next) {
    try {
      var request = requestUtils(req);

      const user = req.body;
      user.password = password.randomPassword({
        characters: [
          password.lower,
          password.upper,
          password.digits,
          password.symbols,
        ],
      });

      const cognitoUser = await CognitoService.signUp(
        user.email,
        user.password
      );

      if (cognitoUser.error) {
        console.log("ERROR", cognitoUser.error);
        return res.status(500).send(cognitoUser.error);
      }

      user.cognitoId = cognitoUser.userSub;

      user.cognitoId = cognitoUser.response.cognitoId;

      const newUser = await usersDAO.addUser(user);

      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async getAccount(req, res, next) {
    try {
      var request = requestUtils(req);

      logger.info(
        "Users Controller getAccount: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const token = req.headers.authorization.split(" ")[1];

      const user = await AuthHelper.getUser(token, "cognito");

      // User found
      if (user) {
        // The role user is the only role that does not have a company
        if (user.role != "user") {
          // Find the company associated with the user
          const company = await companiesDAO.getCompanyByUserId(user._id);
          // User populated with company information
          user.company = company;

          request.statusCode = 200;
          request.response = user;

          logger.info(
            "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
              JSON.stringify(user, null, 2) +
              "\n"
          );

          res.status(200).json(user);
          // User not associated with a company
        }
        // User is not associated with a company
        else {
          request.statusCode = 200;
          request.response = user;
          logger.info(
            "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
              JSON.stringify(user, null, 2) +
              "\n"
          );
          // Return the user without company information
          res.status(200).json(user);
        }
      }
      // User not found
      else {
        request.statusCode = 404;
        request.response = { message: "Couldn't fetch user account." };

        logger.warn(
          "Users Controller getAccount error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        res.status(404).json({ message: "Couldn't fetch user account." });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async getUser(req, res, next) {
    try {
      var request = requestUtils(req);

      const userId = req.params.id;

      // Get user by id
      const user = await usersDAO.getUserById(userId);

      // User found
      if (user) {
        // The role user is the only role that does not have a company
        if (user.role != "user") {
          // Find the company associated with the user
          const company = await companiesDAO.getCompanyByUserId(user._id);
          // User populated with company information
          user.company = company;

          request.statusCode = 200;
          request.response = user;
          logger.info(
            "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
              JSON.stringify(user, null, 2) +
              "\n"
          );

          res.status(200).json(user);
        }

        // User not associated with a company
        else {
          request.statusCode = 200;
          request.response = user;
          logger.info(
            "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
              JSON.stringify(user, null, 2) +
              "\n"
          );
          // Return the user without company information
          res.status(200).json(user);
        }
      }
      // User does not exist
      else {
        request.statusCode = 404;
        request.response = { message: "User does not exist." };

        logger.warn(
          "Users Controller getUser error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        res.status(404).json({ message: "User does not exist." });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async updateUser(req, res, next) {
    try {
      var request = requestUtils(req);

      const userId = req.params.id;
      const user = req.body;

      // Check if user already exists by verifying the id
      const userExists = await usersDAO.getUserById(userId);
      if (!userExists) {
        return res.status(400).send("User does not exist");
      }

      const updatedUser = await usersDAO.updateUser(userId, user);

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async deleteUser(req, res, next) {
    try {
      var request = requestUtils(req);

      const userId = req.params.userId;

      // Check if user already exists by verifying the id
      const userExists = await usersDAO.getUserById(userId);
      if (!userExists) {
        return res.status(400).send("User does not exist");
      }

      const deletedUser = await usersDAO.deleteUser(userId);

      res.status(200).json(deletedUser);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async getUsers(req, res, next) {
    try {
      var request = requestUtils(req);

      var request = requestUtils(req);

      let mongodbResponse;

      logger.info(
        "Attempting to get users from MongoDB: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      mongodbResponse = await usersDAO.getUsers();

      if (mongodbResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: mongodbResponse.error.message };

        logger.error(
          "Error fetching users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).json({ error: mongodbResponse.error.message });
      } else {
        request.statusCode = 200;
        request.response = mongodbResponse;

        logger.info(
          "Successfully fetched users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(200).json(mongodbResponse);
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );
    }
  }

  /**
   * @debug
   * @description
   */
  static async getUsersByCompanyId(req, res, next) {
    try {
      var request = requestUtils(req);
    } catch (error) {}
  }
}
