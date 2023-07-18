import { Request, Response, NextFunction } from 'express';
import logger from '../../../logs/logger';
import HTTP_Error from '../../../utils/errors/http/http-error';
import LayerError from '../../../utils/errors/layer/layer-error';
import { MulterError } from 'multer';

import { IAPIResponse } from '../../interfaces';

export default function ErrorHandler(
  err: HTTP_Error | LayerError | MulterError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let error = {
    ...err,
    stack: err.stack,
  };

  logger.info(`Error Handler Middleware Request: \n ${JSON.stringify(error, null, 2)} \n`);

  if (err instanceof HTTP_Error && err.isOperational) {
    // Handle operational HTTP_Error
    logger.error(`HTTP_Error: ${err.stack}`);
    const response: IAPIResponse = {
      data: {
        error: {
          message: err.message,
          type: err.type,
        },
      },
      statusCode: err.statusCode,
    };

    if (err.type === 'INTERNAL_SERVER_ERROR') {
      response.data.error.message = 'Internal Server Error.';
    }

    return next(response);
  }

  if (err instanceof LayerError && err.isOperational) {
    // Handle operational LayerError
    logger.error(`LayerError: ${err.stack}`);
    const response: IAPIResponse = {
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

    const response: IAPIResponse = {
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

  if (err instanceof Error) {
    const response: IAPIResponse = {
      data: {
        error: {
          message: err.message,
          type: 'VALIDATION_ERROR',
        },
      },
      statusCode: 400,
    };
    return next(response);
  }

  /**
   * If the err is not an instance of HTTP_Error or LayerError, then it is a normal response that successfully passed through the application.
   * In this case, we will return the response as is.
   */
  let response = err;

  logger.info(`Error Handler Middleware Response: No error found, returning response as is. \n`);

  next(response);
}
