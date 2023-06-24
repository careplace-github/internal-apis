import httpStatusCodes from '../httpStatusCodes';
import HTTP_Error from '../httpError';

export default class API403Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.FORBIDDEN,
    type = 'FORBIDDEN',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
