import { Request, Response, NextFunction } from 'express';

import logger from '../../../../logs/logger';

import {
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../../config/constants/index';

import authUtils from '../../utils/auth/auth.utils';

import { HTTPError } from '@utils';
export default function clientGuard(app: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      let AuthUtils = authUtils;

      if (app === 'business') {
        app = AWS_COGNITO_BUSINESS_CLIENT_ID || '';
      } else if (app === 'marketplace') {
        app = AWS_COGNITO_MARKETPLACE_CLIENT_ID || '';
      }

      if (!req.headers.authorization) {
        throw new HTTPError._401(`Missing required authorization header.`);
      }

      let accessToken = req.headers.authorization.split(' ')[1];

      let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

      let userClientId = decodedToken['client_id'] as string;

      logger.info(`User Client Id: ${userClientId}`);
      logger.info(`App Client Id: ${app}`);

      if (userClientId === app) {
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
