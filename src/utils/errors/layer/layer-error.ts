/**
 * Class to manage Layer Errors.
 */
export default class LayerError extends Error {
  type: string;
  isOperational: boolean;
  description?: string;
  constructor(message: string, type: string, isOperational = true, description?: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.message = message;
    this.type = type;
    this.isOperational = isOperational;
    this.description = description;

    Error.captureStackTrace(this);
  }
}
