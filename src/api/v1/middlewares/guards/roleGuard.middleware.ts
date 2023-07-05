import { Request, Response, NextFunction } from 'express';
import authHelper from '../../helpers/auth/auth.helper';
import logger from '../../../../logs/logger';

interface User {
  role: string;
}

interface RequestUtilsResponse {
  data?: any;
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
 * // This middleware will only allow a user to access the resource if the user has the role "admin" or "healthUnit_owner" or "healthUnit_board_member"
 * router.get("/users/:id", validateAccess(["admin", "healthUnit_owner", "healthUnit_board_member"]), async (req, res) => {
 *  [...]
 * });
 */
export default function validateRole(
  roles: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return function (req: Request, res: Response, next: NextFunction): void {
    async function handleRequest() {
      try {
        let response: RequestUtilsResponse = {};

        const AuthHelper = authHelper;

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          const token = req.headers.authorization.split(' ')[1];

          if (token) {
            const user: User = await AuthHelper.getUserFromDB(token);

            const userRole = user.role;

            if (roles.includes(userRole)) {
              response.data = { message: 'User passed role based guard.' };
              response.statusCode = 200;

              logger.info(JSON.stringify(response, null, 2) + '\n');

              next();
            } else {
              response.data = {
                message: 'User did not pass the role based guard.',
              };
              response.statusCode = 403;

              logger.info(JSON.stringify(response, null, 2) + '\n');

              res.status(403).send('Forbidden');
            }
          } else {
            response.data = { message: 'No token provided' };
            response.statusCode = 400;

            logger.warn(JSON.stringify(response, null, 2) + '\n');

            res.status(400).send('No token provided.');
          }
        } else {
          response.data = { message: 'Invalid token' };
          response.statusCode = 400;

          logger.warn(JSON.stringify(response, null, 2) + '\n');

          res.status(400).send('Invalid token');
        }
      } catch (error: any) {
        console.log(error.stack);
      }
    }
    handleRequest();
  };
}
