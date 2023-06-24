import httpStatusCodes from '../httpStatusCodes';
import HTTP_Error from '../httpError';

export default class API401Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.UNAUTHORIZED,
    type = 'UNAUTHORIZED',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
