import httpStatusCodes from "../assets/httpStatusCodes.js";
import BaseError from "../utils/baseError.js";

export default class API404Error extends BaseError {
  constructor(
    message,
    statusCode = httpStatusCodes.BAD_REQUEST,
    type = "BAD_REQUEST",
    isOperational = true
  ) {
    super(message, statusCode, isOperational, type);
  }
}
