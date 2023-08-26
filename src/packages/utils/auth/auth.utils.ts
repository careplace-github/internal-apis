// jwt-decode
import jwt_decode, { JwtPayload } from 'jwt-decode';

// @api
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
//
import JWTContext from './context/jwt-context';
import CognitoContext from './context/cognito-context';

/**
 * Class with utility functions for authentication with different authentication contexts.
 */
export default class AuthUtils {
  static async decodeJwtToken(accessToken: string): Promise<JwtPayload> {
    logger.info(`Authentication Utils DECODE_JWT_TOKEN Request: \n ${accessToken}`);

    if (!accessToken) {
      throw new HTTPError._401('Unauthorized: No token provided');
    }

    const decodedToken = await JWTContext.decodeToken(accessToken);

    logger.info(
      `Authentication Utils DECODE_JWT_TOKEN Response: \n ${JSON.stringify(decodedToken, null, 2)}`
    );

    return decodedToken;
  }

  static async isValidJwtToken(accessToken: string): Promise<boolean> {
    logger.info(`Authentication Utils IS_VALID_JWT_TOKEN Request: \n ${accessToken}`);

    if (!accessToken) {
      throw new HTTPError._401('Unauthorized: No token provided');
    }

    const verifyToken = await CognitoContext.verifyToken(accessToken);

    const isValidToken = !!verifyToken;

    logger.info(`Authentication Utils IS_VALID_JWT_TOKEN Response: \n ${isValidToken}`);

    return isValidToken;
  }
}
