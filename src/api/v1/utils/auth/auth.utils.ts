// @api
import { HTTPError } from '@api/v1/utils';
// @logger
import logger from '@logger';
//
import jwtContext from './context/jwtContext';

/**
 * Class with utility functions for authentication with different authentication contexts.
 */
export default class AuthUtils {
  static async decodeJwtToken(accessToken: string) {
    logger.info(`Authentication Utils DECODE_JWT_TOKEN Request: \n ${accessToken}`);

    if (!accessToken) {
      throw new HTTPError._401('Unauthorized: No token provided');
    }

    const decodedToken = await jwtContext.decodeToken(accessToken);

    logger.info(
      `Authentication Utils DECODE_JWT_TOKEN Response: \n ${JSON.stringify(decodedToken, null, 2)}`
    );

    return decodedToken;
  }

  static async isValidJwtToken(accessToken: string) {
    logger.info(`Authentication Utils IS_VALID_JWT_TOKEN Request: \n ${accessToken}`);

    if (!accessToken) {
      throw new HTTPError._401('Unauthorized: No token provided');
    }

    const isValidToken = await jwtContext.isValidToken(accessToken);

    logger.info(`Authentication Utils IS_VALID_JWT_TOKEN Response: \n ${isValidToken}`);

    return isValidToken;
  }
}
