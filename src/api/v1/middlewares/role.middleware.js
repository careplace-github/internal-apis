import AuthHelper from "../helpers/auth.helper.js";
import usersDAO from "../db/usersDAO.js";
import logger from "../../../logs/logger.js";

/**
 * @description Role Based Guard Middleware. Verifies if the user that made the request has one of the roles that are passed in the parameters of this function. If the user has one of the roles, then the request is passed to the next middleware. If the user does not have one of the roles, then the request is not passed to the next middleware. 
 * @param {Array<String>} roles - Array of roles that the user must have to pass the guard.
 * @returns Boolean - True if the user has one of the roles, false otherwise.
 */
export default function validateRole(roles) {
  return function (req, res, next) {
    logger.info("Role Validation Middleware");
    // Check that the request contains a token
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      logger.info("Token provided");
      const token = req.headers.authorization.split(" ")[1];

      const decodedToken = AuthHelper.decodeToken(token);

      logger.info("decodedToken: " + JSON.stringify(decodedToken));

      // Asynchronously get the user from the database
      usersDAO.getUserByAuthId(decodedToken.sub, "cognito").then((user) => {
        const userRole = user.role;

        logger.info("User role: " + userRole);

        if (roles.includes(userRole)) {
          // The user's role is in the list of roles that are allowed to access the resource
          // Pass the request to the next middleware
          logger.info(
            "The user's role is in the list of roles that are allowed to access the resource. Passed to next middleware"
          );
          next();
        } else {
          // The user's role is not in the list of roles that are allowed to access the resource
          logger.info(
            "The user's role is not in the list of roles that are allowed to access the resource"
          );
          res.status(403).send("Forbidden");
        }
      });
    } else {
      // If there is no token, respond appropriately
      logger.warn("No token provided");
      res.status(401).send("No token provided.");
    }
  };
}
