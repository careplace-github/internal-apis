import httpStatusCodes from "../assets/httpStatusCodes.js";
import BaseError from "../../../utils/baseError.utils.js";

export default class API401Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = "UNAUTHORIZED",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
