import { Request, Response, NextFunction } from 'express';

import logger from '../../../logs/logger';

import {
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
  AWS_COGNITO_ADMIN_CLIENT_ID,
} from '../../../config/constants/index';

import authUtils from '../../utils/auth/auth.utils';

import { HTTPError } from '@utils';
export default function clientGuard(app: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      let AuthUtils = authUtils;

      if (app === 'business') {
        app = AWS_COGNITO_BUSINESS_CLIENT_ID || '';
        logger.info("Business Client Id: " + app)
      } else if (app === 'marketplace') {
        app = AWS_COGNITO_MARKETPLACE_CLIENT_ID || '';
      } else if (app === 'admin') {
        app = AWS_COGNITO_ADMIN_CLIENT_ID || '';
      }

      const reqClientId = req.headers['x-client-id'] as string;

      if (!reqClientId) {
        throw new HTTPError._400(`You must provide a client id in the headers.`);
      }

      logger.info(`User Client Id: ${reqClientId}`);
      logger.info(`App Client Id: ${app}`);

      if (reqClientId === app) {
        logger.info(`User passed endpoint access guard.`);
        next();
      } else {
        throw new HTTPError._403(
          `You do not have access to this endpoint. Please contact your administrator.`
        );
      }
    } catch (error) {
      next(error);
    }
  };
}
