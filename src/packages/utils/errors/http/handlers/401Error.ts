import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API401Error extends HTTP_Error {
  constructor(
    message,
    code?: string,

    statusCode = httpStatusCodes.UNAUTHORIZED,
    type = 'UNAUTHORIZED',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
