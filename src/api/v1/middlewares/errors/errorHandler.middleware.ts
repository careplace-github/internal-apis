import { Request, Response, NextFunction } from 'express';
import logger from '../../../../logs/logger';
import HTTP_Error from '../../utils/errors/http/httpError';
import LayerError from '../../utils/errors/layer/layerError';
import { MulterError } from 'multer';

import { IApiResponse } from '../../interfaces';

export default function errorHandler(
  err: HTTP_Error | LayerError | MulterError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.info(`Error Handler Middleware Request: \n ${JSON.stringify(err, null, 2)} \n`);

  if (err instanceof HTTP_Error && err.isOperational) {
    // Handle operational HTTP_Error
    logger.info(`Operational HTTP_Error: ${err.stack}`);
    const response: IApiResponse = {
      data: {
        error: {
          message: err.message,
          type: err.type,
        },
      },
      statusCode: err.statusCode,
    };
    return next(response);
  }

  if (err instanceof LayerError && err.isOperational) {
    // Handle operational LayerError
    logger.info(`Operational LayerError: ${err.stack}`);
    const response: IApiResponse = {
      data: {
        error: {
          message: err.message,
          type: err.type,
        },
      },
      statusCode: 400, // default status code for LayerError
    };
    return next(response);
  }

  if (err instanceof MulterError) {
    // Handle operational MulterError
    let message: string;
    let statusCode: number;
    let type: string;

    switch (err.code) {
      case 'LIMIT_UNEXPECTED_FILE':
        message = `${err.message}: ${err.field}`;
        statusCode = 400;
        type = 'BAD_REQUEST';
        break;
      default:
        message = err.message;
        statusCode = 400;
        type = 'BAD_REQUEST';
    }

    const response: IApiResponse = {
      data: {
        error: {
          message,
          type,
        },
      },
      statusCode,
    };
    return next(response);
  }

  /**
   * If the err is not an instance of HTTP_Error or LayerError, then it is a normal response that successfully passed through the application.
   * In this case, we will return the response as is.
   */
  let response = err;

  next(response);
}
