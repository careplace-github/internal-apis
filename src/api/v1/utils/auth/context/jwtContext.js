import jwt_decode from "jwt-decode";
import logger from "../../../../../logs/logger.js";
import * as Error from "../../errors/http/index.js";

/**
 * Class with utility functions for JWT authentication context.
 *
 *    * @see https://www.npmjs.com/package/jwt-decode
 */
export default class JwtContext {
  /**
   * @description Decodes a JWT token.
   * @param {String} accessToken - JWT token.
   * @returns {Promise<JSON>} A JSON object containing the decoded token.
   */
  static async decodeToken(accessToken) {
    try {
      const decodedToken = await jwt_decode(accessToken);
      return decodedToken;
    } catch (error) {
      switch (error.name) {
        /**
         * @todo
         */
        case "InvalidTokenError":
          break;

        default:
          throw new Error.InternalServerError("Internal Server Error");
      }
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
      throw new Error.InternalServerError("Internal Server Error");
    }
  }
}
