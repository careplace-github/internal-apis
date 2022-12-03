


import AwsConfig from "../helpers/cognito.helper.js";
import usersDAO from "../db/usersDAO.js";

let cognitoAttributeList = [];

// @param {array} roles - array of roles
export default function validateRole(roles) {
  return function (req, res, next) {
    // Check that the request contains a token
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const token = req.headers.authorization.split(" ")[1];

      const decodedToken = AwsConfig.decodeJWTToken(token);

      console.log("decodedToken: " + JSON.stringify(decodedToken));

      // Asynchronously get the user from the database
      usersDAO.getUserByAuthId(decodedToken.sub, "cognito").then((user) => {
        const userRole = user.role;

        console.log("userRole: " + userRole);

        for (let i = 0; i < roles.length; i++) {
          if (roles[i] === userRole) {
            return next();
          }
        }

        // User is not authorized
        return res.status(403).send("Forbidden");
      });
    } else {
      // If there is no token, respond appropriately
      res.status(401).send("No token provided.");
    }
  };
}
