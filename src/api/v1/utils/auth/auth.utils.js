import jwtContext from "./context/jwtContext.js";
import logger from "../../../../logs/logger.js";
import * as Error from "../../helpers/errors/errors.helper.js";

/**
 * Class with utility functions for authentication with different authentication contexts.
 */
export default class AuthUtils {
  /**
   * Constructor
   */
  constructor() {

  }

  async decodeJwtToken(accessToken) {
    try {
      logger.info(
        `Authentication Utils DECODE_JWT_TOKEN Request: \n ${accessToken}`
      );

      const decodedToken = await jwtContext.decodeToken(accessToken);

      logger.info(
        `Authentication Utils DECODE_JWT_TOKEN Response: \n ${accessToken}`
      );

      return decodedToken;
    } catch (error) {

     // throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  async isValidJwtToken(accessToken) {
    try {
      logger.info(
        `Authentication Utils IS_VALID_JWT_TOKEN Request: \n ${accessToken}`
      );

      const isValidToken = await jwtContext.isValidToken(accessToken);

      logger.info(
        `Authentication Utils IS_VALID_JWT_TOKEN Response: \n ${accessToken}`
      );

      return isValidToken;
    } catch (error) {
     // throw new Error._500(`Internal Server Error: ${error}`);
    }
  }
}
