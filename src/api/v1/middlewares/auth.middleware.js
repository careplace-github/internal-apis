import logger from "../../../logs/logger.js";
import AuthHelper from "../helpers/auth.helper.js";

import { api_url } from "../../../config/constants/index.js";

const host = api_url || "http://localhost:3000/api/v1";

/**
 * Middleware to validate if a user is authenticated through the JWT token.
 * JWT token is passed in the header of the request
 * The token is validated by the expiration date and the signature.
 * If the token is valid, the request is passed to the next middleware.
 * If the token is invalid, a 401 Unauthorized is returned.
 * If the token is not present, a 400 Unauthorized is returned.
 */
export default function validateAuth(req, res, next) {
  async function handleRequest() {
    try {
      var request = {
        request: {
          type: "POST",
          url: `${host}/auth/signup`,
          headers: req.headers,
          body: req.body,
        },
        statusCode: 100,
      };

      logger.info(
        "Authentication Validation Middleware: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      // Check that the request contains a token
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        // Validate the token
        const token = req.headers.authorization.split(" ")[1];

        if (token) {
          const response = await AuthHelper.isLoggedIn(token);

          if (response) {
            // Token is valid

            request.response = { message: "User authenticated" };
            request.statusCode = 200;

            logger.info(JSON.stringify(request, null, 2) + "\n");

            // Pass the request to the next middleware
            next();
          } else {
            // Token is invalid

            request.response = { message: "Invalid token" };
            request.statusCode = 401;

            logger.info(JSON.stringify(request, null, 2) + "\n");

            res.status(401).send("Unauthorized");
          }
        } else {
          // If there is no token, respond appropriately
          request.response = { message: "Invalid token" };
          request.statusCode = 400;

          logger.info(JSON.stringify(request, null, 2) + "\n");

          res.status(400).send("No token provided.");
        }
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );
    }
  }
  // Call the async function
  handleRequest();
}
