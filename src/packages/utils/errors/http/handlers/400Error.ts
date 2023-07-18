import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API404Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = 'INVALID_REQUEST',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
