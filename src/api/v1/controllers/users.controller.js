import password from "secure-random-password";
import CognitoService from "../services/cognito.service.js";

import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

import AuthHelper from "../helpers/auth.helper.js";

import logger from "../../../logs/logger.js";

import { api_url } from "../../../config/constants/index.js";

const host = api_url || "http://localhost:3000/api/v1";

export default class UsersController {
  static async createUser(req, res, next) {
    try {
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
    console.log("getAccount");

    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const token = req.headers.authorization.split(" ")[1];

      const user = await AuthHelper.getUser(token, "cognito");

      console.log(user);

      res.status(200).json(user);
    }
  }


/**
 * @debug
 * @description 
 */
  static async getUser(req, res, next) {
    try {
      const userId = req.params.id;

      const user = await usersDAO.getUserById(userId);

      if (user) {
        if (user.role != "user") {
          const company = await companiesDAO.getCompanyByUserId(userId);
          user.company = company;
        }
        res.status(200).json(user);
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      next(error);
    }
  }


/**
 * @debug
 * @description 
 */
  static async updateUser(req, res, next) {
    try {
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

      var request = {
        request: {
          type: "POST",
          url: `${host}/auth/signup`,
          headers: req.headers,
          body: req.body,
          
        },
        statusCode: 100,
      };

      let mongodbResponse;

      logger.info(
        "Attempting to get users from MongoDB: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

    
     mongodbResponse = await usersDAO.getUsers();

     if(mongodbResponse.error != null){
      request.statusCode = 400;
        request.response = { error: mongodbResponse.error.message };

        logger.error(
          "Error fetching users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).json({ error: mongodbResponse.error.message });
      }
      else {
        request.statusCode = 200;
        request.response = mongodbResponse;

        logger.info(
          "Successfully fetched users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(200).json(mongodbResponse);

      }
     }

   
     catch (error) {
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
  }

}
