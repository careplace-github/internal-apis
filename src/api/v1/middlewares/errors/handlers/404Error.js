import httpStatusCodes from "../assets/httpStatusCodes.js";
import BaseError from "../../../utils/baseError.utils.js";

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
