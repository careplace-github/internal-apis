import AuthHelper from "../helpers/auth.helper.js";
import usersDAO from "../db/users.dao.js";
import companiesDAO from "../db/companies.dao.js";
import mongodb from "mongodb";

import logger from "../../../logs/logger.js";

import requestUtils from "../utils/request.utils.js";

const ObjectId = mongodb.ObjectId;

/**
 * @description Middleware that only allows a user to access information about themselves. If the user that is trying to access the information is not the same as the user that is trying to access the information, but the user is an admin, or company owner or company board member (from the same company that the user that is trying to access the information), then the user is allowed to access the information.
 * The id of the user that the information is trying to be access is passed in the request parameters
 * The id of the user that is trying to access the information is extracted from the access token.
 *
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void} - Returns nothing.
 */
export default function validateAccess(req, res, next) {
  // Async function to handle the request
  async function handleRequest() {
    // try {
    var request = requestUtils(req);

    logger.info(
      "Access Validation Middleware: " + JSON.stringify(request, null, 2) + "\n"
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
        // User which the request is being made by
        // Fetch user by auth token - extracted from the request header
        const requesterUser = await AuthHelper.getUser(token, "cognito");
        const requesterUserId = requesterUser._id;

        // User which the request is being made for
        // Fetch user by id - extracted from the request parameters
        const requestedUserId = req.params.id;
        const requestedUser = await usersDAO.getUserById(requesterUserId);
        // Fetch requester user company
        const requestedUserCompany = await companiesDAO.getCompanyByUserId(
          requesterUserId
        );
        requestedUser.company = requestedUserCompany;

        // Check if the user is trying to access information about themselves
        if (ObjectId(requestedUserId).equals(ObjectId(requesterUserId))) {
          // The user's id in the token matches the user's id in the request parameters
          // The user that is making the request is the same user that the request is being made for
          // Pass the request to the next middleware

          request.response = {
            message: "User is allowed to access the resource.",
            requesterUser: requesterUser,
            requestedUser: requestedUser,
          };

          request.statusCode = 200;

          logger.info(JSON.stringify(request, null, 2) + "\n");

          // Pass the request to the next middleware
          next();
        }
        // The user that made the request is not the same user that the request is being made for
        else {
          // Check if both users are associated with a company
          if (requestedUser.company && requesterUser.company) {
            // Both users are associated with a company

            // Check if both users are associated with the same company and if the user making the request is an admin, company owner or company board member of the company that the user that the request is being made for is associated with.
            if (
              requestedUser.company._id.equals(
                ObjectId(requesterUser.company._id)
              ) &&
              (requesterUser.role == "admin" ||
                requesterUser.role == "companyOwner" ||
                requesterUser.role == "companyBoard")
            ) {
              // The user that made the request is an admin, company owner or company board member of the company that the requested user belongs to
              // Access to resource allowed
              request.response = {
                message:
                  "User is allowed to access the resource. The user that made the request is an admin, company owner or company board member of the company that the requested user belongs to.",
                requesterUser: requesterUser,
                requestedUser: requestedUser,
              };

              request.statusCode = 200;

              logger.info(JSON.stringify(request, null, 2) + "\n");

              // Pass the request to the next middleware
              next();
            }
            // Users are not associated with the same company and/or the user that made the request is not an admin, company owner or company board member of the company that the requested user belongs to.
            else {
              // Access to resource not allowed
              request.response = {
                message:
                  "Access to resource not allowed. The user that made the request is not an admin, company owner or company board member of the company that the requested user belongs to.",
                requesterUser: requesterUser,
                requestedUser: requestedUser,
              };

              request.statusCode = 403;

              logger.warn(JSON.stringify(request, null, 2) + "\n");

              res.status(403).send("Forbidden");
            }
          }
          // Couldn't find a company for one or both users
          else {
            // User is not allowed to access the requested user's information

            request.response = {
              message:
                "Access to resource not allowed. The request user and requested user don't belong to the same company.",
              requesterUser: requesterUser,
              requestedUser: requestedUser,
            };

            request.statusCode = 403;

            logger.warn(JSON.stringify(request, null, 2) + "\n");

            res.status(403).send("Forbidden");
          }
        }
      }
      // Token not provided
      else {
        request.response = { message: "No token provided" };
        request.statusCode = 400;

        logger.warn(JSON.stringify(request, null, 2) + "\n");

        res.status(400).send("No token provided.");
      }
    }

    // The request does not contain a header field "Bearer"
    else {
      request.response = { message: "Invalid token" };
      request.statusCode = 400;

      logger.warn(JSON.stringify(request, null, 2) + "\n");

      res.status(400).send("Invalid token");
    }

    /**
       *   } catch (error) {
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
