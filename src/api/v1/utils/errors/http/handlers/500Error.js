import httpStatusCodes from "../httpStatusCodes"
import HTTP_Error from "../httpError";

export default class API500Error extends HTTP_Error {
  constructor(
    message,
    statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR,
    type = "INTERNAL_SERVER_ERROR",
    isOperational = true,
    description
  ) {
    super(message, statusCode, isOperational, type, description);
  }
}
