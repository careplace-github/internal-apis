import { Request, Response, NextFunction } from 'express';
import logger from '@logger';
import HTTPError from '@packages/utils/errors/http/http-error';
import LayerError from '@packages/utils/errors/layer/layer-error';
import { MulterError } from 'multer';

import { IAPIResponse } from '../../interfaces';

export default function ErrorHandler(
  err: typeof HTTPError | typeof LayerError | MulterError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = {
    ...err,
    stack: err.stack,
  };

  logger.info(`Error Handler Middleware Request: \n ${JSON.stringify(error, null, 2)} \n`);

  if (err instanceof HTTPError && err.isOperational) {
    // Handle operational HTTPError
    logger.error(`HTTPError: ${err.stack}`);
    const response: IAPIResponse = {
      data: {
        error: {
          message: err.message,
          code: err.code,
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
          code: 'InputValidationError',
        },
      },
      statusCode: 400,
    };
    return next(response);
  }

  /**
   * If the err is not an instance of HTTPError or LayerError, then it is a normal response that successfully passed through the application.
   * In this case, we will return the response as is.
   */
  const response = err;

  logger.info(`Error Handler Middleware Response: No error found, returning response as is. \n`);

  next(response);
}
