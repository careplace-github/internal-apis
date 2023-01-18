import httpStatusCodes from "../httpStatusCodes.js"
import BaseError from "../../../utils/errors/baseError.utils.js";

export default class API404Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.NOT_FOUND,
    type = "NOT_FOUND",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
