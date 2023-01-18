import httpStatusCodes from "../httpStatusCodes.js"
import BaseError from "../../../utils/errors/baseError.utils.js";

export default class API503Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.SERVICE_UNAVAILABLE,
    type = "SERVICE_UNAVAILABLE",
    isOperational = false
  ) {
    super(message, statusCode, isOperational, type);
  }
}
