import jwtContext from "./context/jwtContext.js";
import logger from "../../../../logs/logger.js";
import * as Error from "../errors/http/index.js";

/**
 * Class with utility functions for authentication with different authentication contexts.
 */
export default class AuthUtils {
  /**
   * Constructor
   */
  constructor() {}

  async decodeJwtToken(accessToken) {
    logger.info(
      `Authentication Utils DECODE_JWT_TOKEN Request: \n ${accessToken}`
    );

    const decodedToken = await jwtContext.decodeToken(accessToken);

    logger.info(
      `Authentication Utils DECODE_JWT_TOKEN Response: \n ${JSON.stringify(
        decodedToken,
        null,
        2
      )}`
    );

    return decodedToken;
  }

  async isValidJwtToken(accessToken) {
    logger.info(
      `Authentication Utils IS_VALID_JWT_TOKEN Request: \n ${accessToken}`
    );

    const isValidToken = await jwtContext.isValidToken(accessToken);

    logger.info(
      `Authentication Utils IS_VALID_JWT_TOKEN Response: \n ${isValidToken}`
    );

    return isValidToken;
  }
}
