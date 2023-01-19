/**
 * Class to manage Layer Errors.
 */
export default class LayerError extends Error {
  constructor(type, message) {

    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.message = message;
    this.type = type;

    Error.captureStackTrace(this);
  }
}
