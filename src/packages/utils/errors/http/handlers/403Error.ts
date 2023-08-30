import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API403Error extends HTTP_Error {
  constructor(
    message,
    code?: string,

    statusCode = httpStatusCodes.FORBIDDEN,
    type = 'FORBIDDEN',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
