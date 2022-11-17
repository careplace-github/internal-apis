import password from "secure-random-password";
import CognitoService from "../services/cognito.service.js";

import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

import AuthHelper from "../helpers/auth.helper.js";

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

  // Get's the user by the email from the request

  static async getAccount(req, res, next) {
    console.log("getAccount");
    const user = await usersDAO.getUserByAuthId(req.user.sub, "cognito");
    console.log("USER AQUI", user);
    const company = await companiesDAO.getCompanyByUserId(user._id);
    console.log("COMPANY AQUI", company);

    user.company = company;

    res.status(200).json(user);
  }

  static async getUser(req, res, next) {
    try {
      const userId = req.params.userId;

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

  static async updateUser(req, res, next) {
    try {
      const userId = req.params.userId;
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

  static async getUsers(req, res, next) {
    const users = await usersDAO.getUsers();
    res.status(200).json(users);
  }
}
