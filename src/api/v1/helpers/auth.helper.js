import jwt_decode from "jwt-decode";
import CognitoService from "../services/cognito.service.js";

import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

/**
 * Class to manage the authentication process from all the Auth Providers.
 * @class AuthHelper
 * @static
 * @memberof module:helpers
 * @requires module:jwt-decode
 * @requires module:services/cognito.service
 * @requires module:db/usersDAO
 * @requires module:db/companiesDAO
 */
export default class AuthHelper {
  /**
   * @description Decodes a JWT token.
   * @param {String} token - JWT token.
   * @returns {Promise<JSON>} A JSON object containing the decoded token.
   * */
  static async decodeToken(token) {
    return jwt_decode(token);
  }

  /**
   * @description Checks if a user is logged in by checking if the access token is valid. If the token is valid, the user information is fetched from the database. If the user is associated with a company, the company information is also included.
   * @param {String} token - JWT token.
   * @returns {Boolean} True if the user is logged in, false otherwise.
   */
  static async isLoggedIn(token) {
    
    try {
      const decodedToken = await this.decodeToken(token);

      const currentTime = new Date().getTime() / 1000;

      return decodedToken.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  /**
   * @description Returns the id from the authentication provider that is extracted from the access token.
   * @param {String} token - JWT token.
   * @param {String} authProvider - Authentication provider.
   * @returns {Promise<String>} The id from the authentication provider that is extracted from the access token.
   */
  static async getAuthId(token, authProvider) {
    try {
      switch (authProvider) {
        case "cognito":
          return this.decodeToken(token).sub;
      }
    } catch (err) {
      return err;
    }
  }

/**
 * @description Fetches the user details from the authentication provider.
 * @param {String} token - JWT token.
 * @param {String} authProvider - Authentication provider.
 * @returns {Promise<JSON>} A JSON object containing the user details from the authentication provider.
 */
  static async getAuthUser(token, authProvider) {
    try {
      const decodedToken = await this.decodeToken(token);

      switch (authProvider) {
        case "cognito":
          const user = await CognitoService.getUserDetails(token);
          return user;

      }
    } catch (e) {
      return e;
    }
  }

  /**
   * @description Fetches a user information from the database. The query is made by the id from the authentication provider that is extracted from the access token. If the user is associated with a company, the company information is also included.
   * @param {String} token - JWT token.
   * @param {String} authProvider - Authentication provider.
   * @returns {Promise<JSON>} A JSON object containing the user information. If the user is associated with a company, the company information is also included.
   * */
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

}

  
