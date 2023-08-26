import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API404Error extends HTTP_Error {
  constructor(
    message: string,
    statusCode = httpStatusCodes.NOT_FOUND,
    type = 'NOT_FOUND',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
