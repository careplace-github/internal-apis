import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API429Error extends HTTP_Error {
  constructor(
    message,
    code?: string,

    statusCode = httpStatusCodes.TOO_MANY_REQUESTS,
    type = 'TOO_MANY_REQUESTS',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
