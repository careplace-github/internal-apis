import httpStatusCodes from "../httpStatusCodes"
import HTTP_Error from "../httpError";

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
