import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API400Error extends HTTP_Error {
  constructor(
    message,
    code?: string,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = 'INVALID_REQUEST',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type, undefined, code);
  }
}
