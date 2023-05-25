import { Request, Response, NextFunction } from 'express';

import logger from '../../../../logs/logger.js';

import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../../config/constants/index.js';

import authUtils from '../../utils/auth/auth.utils.js';

import * as Error from '../../utils/errors/http/index.js';

export default function accessGuard(app: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      let AuthUtils = new authUtils();

      if (app === 'crm') {
        app = AWS_COGNITO_CRM_CLIENT_ID || '';
      } else if (app === 'marketplace') {
        app = AWS_COGNITO_MARKETPLACE_CLIENT_ID || '';
      }

      if (!req.headers.authorization) {
        throw new Error._401(`Missing required authorization header.`);
      }

      let accessToken = req.headers.authorization.split(' ')[1];

      let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

      let userClientId = decodedToken['client_id'];

      logger.info(decodedToken);

      if (userClientId === app) {
        next();
      } else {
        throw new Error._403(
          `You do not have access to this endpoint. Please contact your administrator.`
        );
      }
    } catch (error) {
      next(error);
    }
  };
}
