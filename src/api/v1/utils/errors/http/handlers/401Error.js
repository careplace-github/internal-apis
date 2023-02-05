import httpStatusCodes from "../httpStatusCodes.js"
import HTTP_Error from "../httpError.js";

export default class API401Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.UNAUTHORIZED,
    type = "UNAUTHORIZED",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
