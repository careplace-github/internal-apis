import jwt_decode from "jwt-decode";
import logger from "../../../../../logs/logger.js";
import * as Error from "../../../helpers/errors/errors.helper.js";

/**
 * Class with utility functions for authentication.
 */
export default class AuthUtils {
  /**
   * @description Decodes a JWT token.
   * @param {String} accessToken - JWT token.
   * @returns {Promise<JSON>} A JSON object containing the decoded token.
   * */
  static async decodeToken(accessToken) {
    try {
      const decodedToken = await jwt_decode(accessToken);

      return decodedToken;
    } catch (error) {
      throw Error._500(`Internal Server Error: ${error}`);
    }
  }

  /**
   * @description Checks if a user is logged in by checking if the access token is valid.
   * @param {String} accessToken - JWT token.
   * @returns {Boolean} True if the user is logged in, false otherwise.
   */
  static async isValidToken(accessToken) {
    try {
      const decodedToken = await this.decodeToken(accessToken);

      const currentTime = new Date().getTime() / 1000;

      return decodedToken.exp > currentTime;
    } catch (error) {
      throw Error._500(`Internal Server Error: ${error}`);
    }
  }
}
