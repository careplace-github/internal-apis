import logger from "../../../../logs/logger.js";

import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from "../../../../config/constants/index.js";

import authUtils from "../../utils/auth/auth.utils.js";

import * as Error from "../../utils/errors/http/index.js";

/**
 * @description Validates the access of a user to an endpoint based on the user's app.
 *
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {void} - Returns nothing.
 */
export default function validateAccess(app) {
  return function (req, res, next) {
    async function handleRequest() {
      try {
        let AuthUtils = new authUtils();

        if (app === "crm") {
          app = AWS_COGNITO_CRM_CLIENT_ID;
        } else if (app === "marketplace") {
          app = AWS_COGNITO_MARKETPLACE_CLIENT_ID;
        }

        let accessToken = req.headers.authorization.split(" ")[1];

        let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

        let userClientId = decodedToken["client_id"];

        logger.info(decodedToken);

        if (userClientId === app) {
          next();
        } else {
          throw new Error._403(
            `You do not have access to this endpoint. Please contact your administrator.`
          );
        }
      } catch (error) {
        next(error);
      }
    }

    // Call the async function
    handleRequest();
  };
}
