/**
 * Class to handle HTTP related errors.
 */
export default class HTTP_Error extends Error {
  type: string;
  isOperational: boolean;
  statusCode: number;
  description?: string;
  code?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean,
    type: string,
    description?: string,
    code?: string
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.message = message;
    this.type = type;
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.description = description;
    this.code = code;

    Error.captureStackTrace(this);
  }
}
