import logger from "../../../../logs/logger.js";
import BaseError from "./utils/baseError.js";

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

    //console.log("ERROR: " + err);

    let response = {
      data: {
        error: {
          message: err.message,
          type: err.type,
        },
      },
      statusCode: err.statusCode,
    };

    if (err instanceof BaseError) {
      logger.warn(`${err.stack} \n`);
    } else {
      logger.error(`${err.stack} \n`);
    }

    next(response);
  }

  handleRequest();
}
