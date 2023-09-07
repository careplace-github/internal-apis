import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '@utils';
import { AWS_COGNITO_MARKETPLACE_CLIENT_ID, AWS_COGNITO_BUSINESS_CLIENT_ID } from '@constants';
import logger from '../../../logs/logger';
import authUtils from '../../utils/auth/auth.utils';

/**
 * @description Middleware to validate if a user is authenticated through the JWT accessToken.
 * JWT accessToken is passed in the header of the request
 * The accessToken is validated by the expiration date and the signature.
 * If the accessToken is valid, the request is passed to the next middleware.
 * If the accessToken is invalid, a 401 Unauthorized is returned.
 * If the accessToken is not present, a 400 Unauthorized is returned.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 * @returns {void} - Returns nothing.
 */
export default function validateAuth(req: Request, res: Response, next: NextFunction): void {
  async function handleRequest() {
    try {
      logger.info(
        `AuthenticationGuard Middleware Request: \n ${JSON.stringify(req.headers, null, 2)} \n`
      );

      const AuthUtils = authUtils;

      let accessToken: string;

      // Check if the request contains a header field "Bearer"
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        // Extract the accessToken from the header
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new HTTPError._400('Missing or invalid token.');
      }

      // accessToken provided
      if (accessToken !== null && accessToken !== undefined) {
        const isLoggedIn = await AuthUtils.isValidJwtToken(accessToken);

        if (isLoggedIn) {
          next();
        } else {
          throw new HTTPError._401('Access token is expired.');
        }
      } else {
        throw new HTTPError._401('Missing required access token.');
      }

      logger.info(
        `Passed AuthenticationGuard Middleware : \n ${JSON.stringify(res.locals, null, 2)} \n`
      );
    } catch (error: any) {
      logger.error(`Authentication Guard Middleware Internal Server Error: ${error.stack}`);
      next(error);
    }
  }
  // Call the async function
  handleRequest();
}
