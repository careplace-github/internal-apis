import httpStatusCodes from "../httpStatusCodes.js"
import HTTP_Error from "../httpError.js";

export default class API404Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = "INVALID_REQUEST",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
