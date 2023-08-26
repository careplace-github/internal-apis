import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API503Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.SERVICE_UNAVAILABLE,
    type = 'SERVICE_UNAVAILABLE',
    isOperational = false
  ) {
    super(message, statusCode, isOperational, type);
  }
}
