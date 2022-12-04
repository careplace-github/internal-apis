import AuthHelper from "../helpers/auth.helper.js";
import usersDAO from "../db/usersDAO.js";
import logger from "../../../logs/logger.js";

let cognitoAttributeList = [];

/**
 * @description Middleware that only allows a user to access information about themselves. If the user that is trying to access the information is not the same as the user that is trying to access the information, but the user is an admin, or company owner or company board member (from the same company that the user that is trying to access the information), then the user is allowed to access the information.
 * 
 * The id of the user that the information is trying to be access is passed in the request parameters
 * The id of the user that is trying to access the information is extracted from the access token.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void}
 */
export default function validateAccess(req, res, next) {
  logger.info("Access Validation Middleware");

  // Async function to handle the request
  async function handleRequest() {
    try {
      // Check that the request contains a token
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        logger.info("Token provided");

        const token = req.headers.authorization.split(" ")[1];

        // Token provided
        if (token) {
          // User which the request is being made for  
          const requestUserId = req.params.id;
          const requestUser = await usersDAO.getUserById(requestUserId)

          // User which the request is being made by
          const user = await AuthHelper.getUser(token, "cognito");
          const userId = user._id

          logger.info("User which the request is being made for" + requestUserId);
          logger.info("User which the request is being made by" + userId);
    

          if (userId == requestUserId) {
            // The user's id in the token matches the user's id in the request parameters
            // The user that is making the request is the same user that the request is being made for
            // Pass the request to the next middleware

            logger.info("The user that is making the request is the same user that the request is being made for. Passed to next middleware");

            next();
          } else {
            // The user that made the request is not the same user that the request is being made for
    
            logger.info("The user that made the request is not the same user that the request is being made for");

           

            // Check if both users are associated with a company
            if (user.company && requestUser.company) {
                // Both users are associated with a company
                logger.info("Both users are associated with a company");
              // Check if both users are associated with the same company and if the user making the request is an admin, company owner or company bpard member to allow access
              if (
                user.company._id == requestUser.company._id &&
                (user.role == "admin" ||
                  user.role == "companyOwner" ||
                  user.role == "companyBoard")
              ) {
                // The user that made the request is an admin, company owner or company board member of the company that the request is being made for
                // Pass the request to the next middleware
                logger.info("The user that made the request is an admin, company owner or company board member of the company that the request is being made for. Passed to next middleware");
                
                next();
              }
            } else {
              // User is not associated with a company
              // User is not allowed to access the requested user's information
                logger.info("User is not associated with a company. User is not allowed to access the requested user's information");
              res.status(403).send("Forbidden");
            }
          }
        }
      } else {
        // Request does not contain a token
        // Return a 401 Unauthorized
        logger.warn("Bad request 401. No token provided");
        res.status(401).send("No token provided.");
      }
    } catch (error) {
     logger.error("Internal server error: " + error);
      res.status(500).send("Internal server error");
    }
  }
  // Call the async function
  handleRequest();
}
