export default class BaseError extends Error {
  constructor(message, statusCode, isOperational, type) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.message = message;
    this.type = type;
    this.isOperational = isOperational;
    this.statusCode = statusCode;

    Error.captureStackTrace(this);
  }
}
