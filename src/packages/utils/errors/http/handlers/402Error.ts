import httpStatusCodes from '../http-status-codes';
import HTTP_Error from '../http-error';

export default class API401Error extends HTTP_Error {
  constructor(
    message: string,
    statusCode = httpStatusCodes.PAYMENT_REQUIRED,
    type = 'PAYMENT_REQUIRED',
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
