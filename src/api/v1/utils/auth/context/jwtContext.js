import jwt_decode from 'jwt-decode';
import logger from '../../../../../logs/logger';
import * as Error from '../../errors/http/index';

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
      if (!accessToken) {
        Error._401('Unauthorized: No token provided');
      }

      const decodedToken = await jwt_decode(accessToken);
      return decodedToken;
    } catch (error) {
      switch (error.name) {
        /**
         * @todo
         */
        case 'InvalidTokenError':
          break;

        default:
          Error._500(`Internal Server Error: ${error.message}`);
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
      if (!accessToken) {
        Error._401('Unauthorized: No token provided');
      }
      const decodedToken = await this.decodeToken(accessToken);

      const currentTime = new Date().getTime() / 1000;

      return decodedToken.exp > currentTime;
    } catch (error) {
      Error._500(`Internal Server Error: ${error.message}`);
    }
  }
}
