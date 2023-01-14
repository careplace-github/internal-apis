import jwt_decode from "jwt-decode";
import CognitoService from "../services/cognito.service.js";

import usersDAO from "../db/users.dao.js";
import companiesDAO from "../db/companies.dao.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";

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
    try {
      logger.info("AUTHENTICATION HELPER DECODE_TOKEN STARTED: ");

      logger.info("AUTHENTICATION HELPER DECODE_TOKEN TOKEN: " + token);

      const decodedToken = await jwt_decode(token);

      return decodedToken;
    } catch (error) {
      logger.error(
        "AUTHENTICATION HELPER DECODE_TOKEN ERROR: " +
          JSON.stringify(error.message, null, 2) +
          "\n"
      );

      return { error: error.message };
    }
  }

  /**
   * @description Checks if a user is logged in by checking if the access token is valid. If the token is valid, the user information is fetched from the database. If the user is associated with a company, the company information is also included.
   * @param {String} token - JWT token.
   * @returns {Boolean} True if the user is logged in, false otherwise.
   */
  static async isLoggedIn(token) {
    try {
      logger.info("AUTHENTICATION HELPER IS_LOGGED_IN STARTED: ");

      const decodedToken = await this.decodeToken(token);

      if (decodedToken.error) {
        logger.error(
          "AUTHENTICATION HELPER IS_LOGGED_IN ERROR: " +
            JSON.stringify(decodedToken.error, null, 2) +
            "\n"
        );
        return { error: decodedToken.error };
      } else {
        const currentTime = new Date().getTime() / 1000;

        const isLoggedIn = decodedToken.exp > currentTime;

        logger.info("AUTHENTICATION HELPER IS_LOGGED_IN RESULT: " + isLoggedIn);

        return isLoggedIn;
      }
    } catch (error) {
      logger.error(
        "AUTHENTICATION HELPER IS_LOGGED_IN ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
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
      logger.info("AUTHENTICATION HELPER GET_AUTH_ID STARTED: ");

      logger.info(
        "AUTHENTICATION HELPER GET_AUTH_ID AUTH PROVIDER: " + authProvider
      );
      logger.info("AUTHENTICATION HELPER GET_AUTH_ID TOKEN: " + token + "\n");

      switch (authProvider) {
        case "cognito":
          const decodedToken = await this.decodeToken(token);
          const authId = decodedToken.sub;
          logger.info("AUTHENTICATION HELPER GET_AUTH_ID RESULT: " + authId);
          return authId;
      }
    } catch (error) {
      logger.error(
        "AUTHENTICATION HELPER GET_AUTH_ID ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );
      return { error: error };
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
      logger.info("AUTHENTICATION HELPER GET_AUTH_USER START: ");

      logger.info(
        "AUTHENTICATION HELPER GET_AUTH_USER AUTH PROVIDER: " + authProvider
      );
      logger.info("AUTHENTICATION HELPER GET_AUTH_USER TOKEN: " + token + "\n");

      const decodedToken = await this.decodeToken(token);

      switch (authProvider) {
        case "cognito":
          const user = await CognitoService.getUserDetails(token);
          logger.info(
            "AUTHENTICATION HELPER GET_AUTH_USER RESULT: " +
              JSON.stringify(user, null, 2)
          );
          return user;
      }
    } catch (error) {
      logger.error(
        "AUTHENTICATION HELPER GET_AUTH_ID ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );
      return { error: error };
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
      logger.info("AUTHENTICATION HELPER GET_USER STARTED ");

      logger.info(
        "AUTHENTICATION HELPER GET_USER AUTH PROVIDER: " + authProvider
      );
      logger.info("AUTHENTICATION HELPER GET_USER TOKEN: " + token + "\n");

      let user;

      const decodedToken = await this.decodeToken(token);

      switch (authProvider) {
        case "cognito":
          user = await usersDAO.get_one_by_auth_id(decodedToken.sub, "cognito");

          logger.info(
            "AUTHENTICATION HELPER GET_USER RESULT: " +
              JSON.stringify(user, null, 2)
          );
      }

      if (user.role != "user") {
        const company = await companiesDAO.getCompanyByUserId(user._id);

        user.company = company;
      }
    } catch (error) {
      logger.error(
        "AUTHENTICATION HELPER GET_USER ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );

      return { error: error };
    }
  }


  static async getUserApp(email) {
    let user;

  

   
        user = await usersDAO.get_one_by_email(email);

        logger.info(
          "AUTHENTICATION HELPER GET_USER_APP RESULT: " +
            JSON.stringify(user, null, 2)
        );

        return user.role == "user" ? "marketplace" : "crm";

        
    }
  }


