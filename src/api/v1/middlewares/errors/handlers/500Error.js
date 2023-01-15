import httpStatusCodes from "../assets/httpStatusCodes.js";
import BaseError from "../../../utils/baseError.utils.js";

export default class API500Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR,
    type = "INTERNAL_SERVER_ERROR",
    isOperational = false
  ) {
    super(message, statusCode, isOperational, type);
  }
}
