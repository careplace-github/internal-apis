import httpStatusCodes from "../httpStatusCodes.js"
import HTTP_Error from "../httpError.js";

export default class API404Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.NOT_FOUND,
    type = "NOT_FOUND",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
