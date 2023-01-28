import logger from "../../../../logs/logger.js";
import authUtils from "../../utils/auth/auth.utils.js";
import * as Error from "../../utils/errors/http/index.js";

/**
 * @description Middleware to validate if a user is authenticated through the JWT accessToken.
 * JWT accessToken is passed in the header of the request
 * The accessToken is validated by the expiration date and the signature.
 * If the accessToken is valid, the request is passed to the next middleware.
 * If the accessToken is invalid, a 401 Unauthorized is returned.
 * If the accessToken is not present, a 400 Unauthorized is returned.
 *
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void} - Returns nothing.
 */
export default function validateAuth(req, res, next) {
  async function handleRequest() {
    try {
      let AuthUtils = new authUtils();

      let accessToken;
      let decodedToken;

      // Check if the request contains a header field "Bearer"
      if (
        req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer"
      ) {
        // Extract the accessToken from the header
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("Missing or invalid token.");
      }

      // accessToken provided
      if (accessToken !== null && accessToken !== undefined) {
        let isLoggedIn = await AuthUtils.isValidJwtToken(accessToken);

        if (isLoggedIn) {
          next();
        } else {
          throw new Error._401("User is not logged in.");
        }
      } else {
        throw new Error._401("Missing required access token.");
      }
    } catch (error) {
      logger.error(
        `Authentication Guard Middleware Internal Server Error: ${error.stack}`
      );
      next(error);
    }
  }
  // Call the async function
  handleRequest();
}
