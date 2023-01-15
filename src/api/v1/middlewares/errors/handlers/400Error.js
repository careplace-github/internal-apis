import httpStatusCodes from "../assets/httpStatusCodes.js";
import BaseError from "../../../utils/baseError.utils.js";

export default class API404Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.UNAUTHORIZED,
    type = "INVALID_REQUEST",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
