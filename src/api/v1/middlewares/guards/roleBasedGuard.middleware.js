import AuthHelper from "../../helpers/auth.helper.js";
import usersDAO from "../../db/users.dao.js";
import logger from "../../../../logs/logger.js";

import requestUtils from "../../utils/request.utils.js";

/**
 * @description Role Based Guard Middleware.
 * Verifies if the user that made the request has one of the roles that are passed in the parameters of this function. If the user has one of the roles, then the request is passed to the next middleware.
 * If the user does not have one of the roles, then the request is not passed to the next middleware.
 *
 * @param {array<String>} roles - The roles that the user must have to be allowed to access the resource.
 *
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void} - Returns nothing.
 *
 * @example
 * // This middleware will only allow a user to access the resource if the user has the role "admin" or "company_owner" or "company_board_member"
 * router.get("/users/:id", validateAccess(["admin", "company_owner", "company_board_member"]), async (req, res) => {
 *  [...]
 * });
 */
export default function validateRole(roles) {
  return function (req, res, next) {
    async function handleRequest() {
      try {
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
            // Asynchronously get the user from the database
            const user = await AuthHelper.getUser(token, "cognito");

            const userRole = user.role;

            // Check if the user has one of the roles that are passed in the parameters of this function
            if (roles.includes(userRole)) {
              // The user's role is in the list of roles that are allowed to access the resource
              // Pass the request to the next middleware

              request.response = { message: "User passed role based guard." };
              request.statusCode = 200;

              logger.info(JSON.stringify(request, null, 2) + "\n");

              // Pass the request to the next middleware
              next();
            }
            // The user's role is not in the list of roles that are allowed to access the resource
            else {
              // The user's role is not in the list of roles that are allowed to access the resource
              request.response = {
                message: "User did not pass the role based guard.",
              };
              request.statusCode = 403;

              logger.info(JSON.stringify(request, null, 2) + "\n");

              res.status(403).send("Forbidden");
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
      } catch (error) {
        request.statusCode = 500;
        request.response = { error: error };

        logger.error(
          "Internal error: " + JSON.stringify(request, null, 2) + "\n"
        );
      }
    }
    // Call the handle function
    handleRequest();
  };
}
