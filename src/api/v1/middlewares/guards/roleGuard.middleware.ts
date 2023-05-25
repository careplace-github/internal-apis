import { Request, Response, NextFunction } from 'express';
import authHelper from '../../helpers/auth/auth.helper';
import logger from '../../../../logs/logger.js';
import requestUtils from '../../utils/server/request.utils';

interface User {
  role: string;
}

interface RequestUtilsResponse {
  response?: { message: string; error?: any };
  statusCode?: number;
}

/**
 * @description Role Based Guard Middleware.
 * Verifies if the user that made the request has one of the roles that are passed in the parameters of this function. If the user has one of the roles, then the request is passed to the next middleware.
 * If the user does not have one of the roles, then the request is not passed to the next middleware.
 *
 * @param {array<String>} roles - The roles that the user must have to be allowed to access the resource.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void} - Returns nothing.
 *
 * @example
 * // This middleware will only allow a user to access the resource if the user has the role "admin" or "company_owner" or "company_board_member"
 * router.get("/users/:id", validateAccess(["admin", "company_owner", "company_board_member"]), async (req, res) => {
 *  [...]
 * });
 */
export default function validateRole(roles: string[]): (req: Request, res: Response, next: NextFunction) => void {
  return function (req: Request, res: Response, next: NextFunction): void {
    async function handleRequest() {
      const request: RequestUtilsResponse = await requestUtils(req);
      try {
        logger.info(
          'Authentication Validation Middleware: ' + JSON.stringify(request, null, 2) + '\n'
        );

        const AuthHelper = new authHelper();

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          const token = req.headers.authorization.split(' ')[1];

          if (token) {
            const user: User = await AuthHelper.getUserFromDB(token);

            const userRole = user.role;

            if (roles.includes(userRole)) {
              request.response = { message: 'User passed role based guard.' };
              request.statusCode = 200;

              logger.info(JSON.stringify(request, null, 2) + '\n');

              next();
            } else {
              request.response = {
                message: 'User did not pass the role based guard.',
              };
              request.statusCode = 403;

              logger.info(JSON.stringify(request, null, 2) + '\n');

              res.status(403).send('Forbidden');
            }
          } else {
            request.response = { message: 'No token provided' };
            request.statusCode = 400;

            logger.warn(JSON.stringify(request, null, 2) + '\n');

            res.status(400).send('No token provided.');
          }
        } else {
          request.response = { message: 'Invalid token' };
          request.statusCode = 400;

          logger.warn(JSON.stringify(request, null, 2) + '\n');

          res.status(400).send('Invalid token');
        }
      } catch (error: any) {
        request.statusCode = 500;
        request.response = { message: error };

        logger.error('Internal error: ' + JSON.stringify(request, null, 2) + '\n');
      }
    }
    handleRequest();
  };
}
