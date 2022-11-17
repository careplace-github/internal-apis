import AuthHelper from "../helpers/auth.helper.js";

/**
 * Middleware to validate the token
 * JWT token is passed in the header of the request
 * The token is validated using the CognitoExpress library
 * If the token is valid, the request is passed to the next middleware
 * If the token is invalid, a 401 Unauthorized is returned
 */
export default function validateAuth(req, res, next) {
  try {
    // Check that the request contains a token
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      // Validate the token
      const token = req.headers.authorization.split(" ")[1];

      // Token provided
      if (token) {
        const response = AuthHelper.isLoggedIn(token);

        if (response) {
          // Token is valid

          console.log("User authenticated");

          // Pass the request to the next middleware
          next();
        } else {
          // Token is invalid
          // Return a 401 Unauthorized
          console.log("User not authenticated");
          res.status(401).send("Unauthorized");
        }
      }
     else {
      // If there is no token, respond appropriately
      console.log("No token provided");
      res.status(404).send("No token provided.");
    }
  }
  } catch (error) {
    console.log(error);
  }
}
