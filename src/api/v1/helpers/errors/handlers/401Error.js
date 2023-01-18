import httpStatusCodes from "../httpStatusCodes.js"
import BaseError from "../../../utils/errors/baseError.utils.js";

export default class API401Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.UNAUTHORIZED,
    type = "UNAUTHORIZED",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
