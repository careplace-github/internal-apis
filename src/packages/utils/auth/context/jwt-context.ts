import jwt_decode, { JwtPayload } from 'jwt-decode';
import { HTTPError } from '@utils';
import {
  AWS_COGNITO_ISSUER,
  AWS_COGNITO_PUBLIC_KEY,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
} from '@constants';
import logger from '@logger';

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

      // Cognito JWT tokens have custom fields in the payload so we can't use JwtPayload types
      const decodedToken: any = await this.decodeToken(accessToken);

      // Verify the client ID
      const clientId = decodedToken.client_id;

      if (
        clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID &&
        clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID
      ) {
        throw new HTTPError._401('Unauthorized: Invalid client ID');
      }

      const currentTime = Math.floor(Date.now() / 1000);

      return !!decodedToken.exp && decodedToken.exp > currentTime;
    } catch (error: any) {
      throw error;
    }
  }
}
