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

  static async getUserById(req, res, next) {
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

  // Get's the user by the email from the request

  static async getAccount(req, res, next) {
    const user = await usersDAO.getUserByEmail(req.body.userEmail);
    const company = await companiesDAO.getCompanyByUserId(user._id);

    user.company = company;

    res.status(200).json(user);
  }

  static async updateUser(req, res, next) {}

  static async deleteUser(req, res, next) {}

  static async getUsers(req, res, next) {
    const users = await usersDAO.getUsers();
    res.status(200).json(users);
  }
}
