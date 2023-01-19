import httpStatusCodes from "../httpStatusCodes.js"
import HTTP_Error from "../httpError.js";

export default class API403Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.FORBIDDEN,
    type = "FORBIDDEN",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
