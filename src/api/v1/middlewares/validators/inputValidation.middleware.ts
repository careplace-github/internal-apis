//import registerUserValitation from "./validators/users.validator"
import { validationResult } from 'express-validator';
import { HTTPError } from '@api/v1/utils/errors/http';
import logger from 'src/logs/logger';
import { Request, Response, NextFunction } from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);

  logger.info(`Input Validation Middleware Request: \n ${JSON.stringify(errors, null, 2)} \n`);

  if (!errors.isEmpty()) {
    logger.error(
      `Input Validation Middleware: Errors found. \n ${JSON.stringify(errors, null, 2)} \n`
    );

    // Throw a 400 error with the errors array
    throw new HTTPError._400(errors.array()[0].msg, undefined, 'VALIDATION_ERROR');
  }

  logger.info('Input Validation Middleware: No errors found.');

  next();
}
