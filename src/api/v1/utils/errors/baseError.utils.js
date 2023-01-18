
/**
 * BaseError class to handle errors in a better way.
 */
export default class BaseError extends Error {
  constructor(message, statusCode, isOperational, type, description) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.message = message;
    this.type = type;
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.description = description;


    Error.captureStackTrace(this);
  }
}
