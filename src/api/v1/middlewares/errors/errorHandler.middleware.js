import logger from "../../../../logs/logger.js";
import BaseError from "../../utils/baseError.utils.js";

export default function errorHandler(err, req, res, next) {
  function handleRequest() {
    /**
     * Utils for error handling.
     *
     * @param {Error} error - The error object.
     * @returns {JSON} - The error with the code and message.
     *
     * @example
     *
     * try {
     *  // Do something
     * } catch (err) {
     *
     * let error = errorUtils(err);
     *
     * res.status(error.statusCode).json(error);
     *
     * }
     */

    

    /**
     * The `ErrorHandler` middleware comes first that the `ResponseHandler` middleware in the middleware stack.
     * So we need to check if the parameter `err` is an error and handle accordingly.
     */
    if (err instanceof BaseError) {
      logger.warn(`${err.stack} \n`);
    } else if (err instanceof Error) {
      logger.error(`${err.stack} \n`);
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
          message: err.message,
          type: err.type,
        },
      },
      statusCode: err.statusCode,
    };

    next(response);
  }

  handleRequest();
}
