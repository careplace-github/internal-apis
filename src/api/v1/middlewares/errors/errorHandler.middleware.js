import logger from "../../../../logs/logger.js";
import HTTP_Error from "../../utils/errors/http/httpError.js";

/**
 * @todo Send the error to the error tracking service. (e.g. Sentry)
 * Errors Handler Middleware
 */
export default function errorHandler(err, req, res, next) {
  function handleRequest() {
    logger.info(`Error Handler: \n ${JSON.stringify(err, null, 2)} \n`);

    /**
     * The `ErrorHandler` middleware comes first that the `ResponseHandler` middleware in the middleware stack.
     * So we need to check if the parameter `err` is an error and handle accordingly.
     */
    if (err instanceof Error) {
      if (
        err.name === "ReferenceError" ||
        err.name === "TypeError" ||
        err.name === "SyntaxError" ||
        err.name === "RangeError" ||
        err.name === "EvalError" ||
        err.name === "URIError" ||
        err.name === "AggregateError" ||
        err.name === "CastError"
      ) {
        err.message = "Internal Server Error";
        err.statusCode = 500;
        err.type = "INTERNAL_SERVER_ERROR";
      }
    } else {
      /**
       * In this case this is not an error.
       * So we need to pass the response (in this case called the parameter `err`) to the `ResponseHandler` middleware.
       */
      next(err);
    }

    let response = {
      data: {
        error: {
          message: err.message ? err.message : "Internal Server Error",
          type: err.type ? err.type : "INTERNAL_SERVER_ERROR",
        },
      },
      statusCode: err.statusCode ? err.statusCode : 500,
    };

    next(response);

    /**
     * @todo - Need to fully implement this.
     * If the error is not operational, restart the server to avoid any further errors that might occur.
     */
    if (err.isOperational === false) {
      process.exit(1);
    }
  }

  handleRequest();
}
