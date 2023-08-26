import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API500Error extends HTTP_Error {
  constructor(
    message: string,
    statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR,
    type = 'INTERNAL_SERVER_ERROR',
    isOperational = true,
    description?: string | undefined
  ) {
    super(message, statusCode, isOperational, type, description);
  }
}
