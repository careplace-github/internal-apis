import logger from "../../../logs/logger.js";
import AuthHelper from "../helpers/auth.helper.js";

import requestUtils from "../utils/request.utils.js";

/**
 * @description Middleware to validate if a user is authenticated through the JWT token.
 * JWT token is passed in the header of the request
 * The token is validated by the expiration date and the signature.
 * If the token is valid, the request is passed to the next middleware.
 * If the token is invalid, a 401 Unauthorized is returned.
 * If the token is not present, a 400 Unauthorized is returned.
 *
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void} - Returns nothing.
 */
export default function validateAuth(req, res, next) {
  async function handleRequest() {
    //  try {
    var request = requestUtils(req);

    logger.info(
      "Authentication Validation Middleware: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    // Check if the request contains a header field "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      // Extract the token from the header
      const token = req.headers.authorization.split(" ")[1];

      // Token provided
      if (token) {
        const response = await AuthHelper.isLoggedIn(token);

        // Token validated
        if (response.error == null) {
          // User is logged in
          if (response) {
            request.response = { message: "User authenticated." };
            request.statusCode = 200;

            logger.info(JSON.stringify(request, null, 2) + "\n");

            // Pass the request to the next middleware
            next();
          }

          // User is not logged in
          else {
            request.response = { message: "Token expired" };
            request.statusCode = 401;

            logger.warn(JSON.stringify(request, null, 2) + "\n");

            res.status(401).send("Token expired");
          }
          // An error occurred while validating the token
        } else {
          request.statudCode = 401;
          request.response = { error: response.error };

          logger.warn(JSON.stringify(request, null, 2) + "\n");

          res.status(401).send({ error: response.error });
        }
      }
      // If there is no token, respond appropriately
      else {
        request.response = { message: "No token provided" };
        request.statusCode = 400;

        logger.warn(JSON.stringify(request, null, 2) + "\n");

        res.status(400).send("No token provided.");
      }
    }
    // If there is no header field "Bearer", respond appropriately
    else {
      request.response = { message: "Invalid token" };
      request.statusCode = 400;

      logger.warn(JSON.stringify(request, null, 2) + "\n");

      res.status(400).send("Invalid token");
    }

    /**
       *  } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      res.status(500).send("Internal error");
    }
       */
  }
  // Call the async function
  handleRequest();
}
