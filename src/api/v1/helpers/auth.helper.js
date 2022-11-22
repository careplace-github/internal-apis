import AWS from "aws-sdk";
import jwt_decode from "jwt-decode";
import AmazonCognitoIdentity from "amazon-cognito-identity-js";

import CognitoService from "../services/cognito.service.js";

import { AWS_user_pool_id } from "../../../config/constants/index.js";
import { AWS_client_id } from "../../../config/constants/index.js";
import { AWS_region } from "../../../config/constants/index.js";
import { AWS_identity_pool_id } from "../../../config/constants/index.js";
import { AWS_access_key_id } from "../../../config/constants/index.js";
import { AWS_secret_access_key } from "../../../config/constants/index.js";

import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

export default class AuthHelper {
  static async decodeToken(token) {
    return jwt_decode(token);
  }

  static async isLoggedIn(token) {
    try {
      const decodedToken = this.decodeToken(token);

      const currentTime = new Date().getTime() / 1000;

      return decodedToken.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  static async getUserId(token, authProvider) {
    try {
      let user;
      let userId;

      const decodedToken = await this.decodeToken(token);

      switch (authProvider) {
        case "cognito":
          user = await usersDAO.getUserByAuthId(decodedToken.sub, "cognito");

          userId = user._id;

          return userId;

        default:
          user = await usersDAO.getUserByAuthId(decodedToken.sub, "cognito");

          userId = user._id;

          return userId;
      }
    } catch (e) {
      return null;
    }
  }

  static async getUser(token, authProvider) {
    try {
      let user;

      const decodedToken = await this.decodeToken(token);

      switch (authProvider) {
        case "cognito":
          user = await usersDAO.getUserByAuthId(decodedToken.sub, "cognito");
          
          

          if (user.role != "user") {

            const company = await companiesDAO.getCompanyByUserId(user._id);
            
            user.company = company;
            
          }

          return user;

        default:
          user = await usersDAO.getUserByAuthId(decodedToken.sub, "cognito");

          if (user.role != "user") {
            const company = await companiesDAO.getCompanyByUserId(user._id);
            user.company = company;
          }

          return user;
      }
    } catch (e) {
      return null;
    }
  }

  static async getUserById(userId) {
    try {
      let user;

      user = await usersDAO.getUserById(userId);

      if (user.role != "user") {
        const company = await companiesDAO.getCompanyByUserId(user._id);
        user.company = company;
      }
      return user;
    } catch (e) {
      return null;
    }
  }
}
