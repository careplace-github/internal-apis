import httpStatusCodes from "../httpStatusCodes.js"
import BaseError from "../../../utils/errors/baseError.utils.js";

export default class API404Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = "INVALID_REQUEST",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
