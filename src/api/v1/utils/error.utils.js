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
export default function ErrorUtils(err) {
  let error = {
    type: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  };

  let statusCode;

  console.log(err)

  switch (err.name) {
    /**
     * 400 Bad Request
     * The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing).
     */
    case "missing_parameter":
      statusCode = 400;
      break;

    /**
     * 400 Bad Request
     * The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing).
     */
    case "unkown_parameter":
      statusCode = 400;
      break;

    /**
     * 400 Bad Request
     * The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing).
     */
    case "invalid_parameter":
      statusCode = 400;
      break;

    /**
     * 400 Bad Request
     * The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing).
     */
    case "invalid_request":
      statusCode = 400;
      break;

    /**
     * 401 Unauthorized
     * The request has not been applied because it lacks valid authentication credentials for the target resource.
     */
    case "unauthorized":
      statusCode = 401;
      break;

    /**
     * 403 Forbidden
     * The server understood the request but refuses to authorize it.
     */
    case "forbidden":
      statusCode = 403;
      break;

    /**
     * 404 Not Found
     * The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.
     */
    case "not_found":
      statusCode = 404;
      break;

    /**
     * 501 Not Implemented
     *  The server does not support the functionality required to fulfill the request.
     */
    case "not_implemented":
      statusCode = 501;
      break;

    /**
     * 502 Bad Gateway
     * The server, while acting as a gateway or proxy, received an invalid response from the upstream server it accessed in attempting to fulfill the request.
     */
    case "bad_gateway":
      statusCode = 502;
      break;

    /**
     * 503 Service Unavailable
     * The server is currently unable to handle the request due to a temporary overload or scheduled maintenance, which will likely be alleviated after some delay.
     */
    case "service_unavailable":
      statusCode = 503;
      break;

    /**
     * 504 Gateway Timeout
     * The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server specified by the URI (e.g. HTTP, FTP, LDAP) or some other auxiliary server (e.g. DNS) it needed to access in attempting to complete the request.
     */
    case "gateway_timeout":
      statusCode = 504;
      break;

    /**
     * 500 Internal Server Error
     * The server encountered an unexpected condition that prevented it from fulfilling the request.
     */
    default:
      statusCode = 500;
      break;
  }

  return {
    statusCode: statusCode,
    error: { error: error },
  };
}
