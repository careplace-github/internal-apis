import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API409Error extends HTTP_Error {
  constructor(
    message,
    code?: string,

    statusCode = httpStatusCodes.CONFLICT,
    type = 'CONFLICT',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
