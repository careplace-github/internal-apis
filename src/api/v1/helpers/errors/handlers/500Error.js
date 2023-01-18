import httpStatusCodes from "../httpStatusCodes.js"
import BaseError from "../../../utils/errors/baseError.utils.js";

export default class API500Error extends BaseError {
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
