import jwt_decode, { JwtPayload } from 'jwt-decode';
import logger from '../../../../../logs/logger';
import { HTTPError } from '@api/v1/utils/errors/http';

/**
 * Class with utility functions for JWT authentication context.
 *
 * @see https://www.npmjs.com/package/jwt-decode
 */
export default class JwtContext {
  /**
   * @description Decodes a JWT token.
   * @param {String} accessToken - JWT token.
   * @returns {Promise<JwtPayload>} A JSON object containing the decoded token.
   */
  static async decodeToken(accessToken: string): Promise<JwtPayload> {
    try {
      if (!accessToken) {
        throw new HTTPError._401('Unauthorized: No token provided');
      }

      const decodedToken: JwtPayload = jwt_decode(accessToken);
      return decodedToken;
    } catch (error: any) {
      switch (error.name) {
        /**
         * @todo
         */
        case 'InvalidTokenError':
          break;

        default:
          throw new HTTPError._500(`Internal Server Error: ${error.message}`);
      }
    }

    throw new HTTPError._500('Internal Server Error');
  }

  /**
   * @description Checks if a user is logged in by checking if the access token is valid.
   * @param {String} accessToken - JWT token.
   * @returns {boolean} True if the user is logged in, false otherwise.
   */
  static async isValidToken(accessToken: string): Promise<boolean> {
    try {
      if (!accessToken) {
        throw new HTTPError._401('Unauthorized: No token provided');
      }
      const decodedToken: JwtPayload = await this.decodeToken(accessToken);

      const currentTime = Math.floor(Date.now() / 1000);

      return !!decodedToken.exp && decodedToken.exp > currentTime;
    } catch (error: any) {
      throw new HTTPError._500(`Internal Server Error: ${error.message}`);
    }
  }
}
