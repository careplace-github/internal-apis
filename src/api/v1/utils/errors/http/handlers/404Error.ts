import httpStatusCodes from '../httpStatusCodes';
import HTTP_Error from '../httpError';

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
