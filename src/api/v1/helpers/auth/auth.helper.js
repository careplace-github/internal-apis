// Import logger
import logger from "../../../../logs/logger.js";
// Import errors helper
import * as Error from "../../utils/errors/http/index.js";
// Authentication Provider
import CognitoContext from "./providers/cognitoContext.js";

import { AUTH_PROVIDER } from "../../../../config/constants/index.js";



/**
 * Create a new instance of the CognitoService.
 */
const cognitoContext = new CognitoContext();

/**
 * Class with utility functions for authentication.
 * AWS Cognito Context.
 */
export default class AuthHelper {
  /**
   * Constructor
   *
   * @param {String} accessToken - JWT token.
   */
  constructor(accessToken) {
    /**
     * @AuthProvider
     */
    this.accessToken = accessToken;
    this.authProvider = this.getAuthProvider();
  }

  getAuthProvider() {
    switch (AUTH_PROVIDER) {
      case "cognito":
        return cognitoContext;

      default:
        throw new Error._500(`Internal Server Error`, `Invalid auth provider.`);
    }
  }

  /**
   * Retrieves the Cognito id from the JWT token.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<String>} Cognito id.
   */
  async getAuthUser(accessToken) {
    try {
      logger.info(
        `Authentication Helper GET_AUTH_USER Request: \n ${accessToken}`
      );

      const authUser = await this.authProvider.getAuthUser(accessToken);

      logger.info(`Authentication Helper GET_AUTH_USER RESULT: \n ${authUser}`);

      return authUser;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  async getRoles(accessToken) {
    try {
      logger.info(`Authentication Helper GET_ROLES Request: \n ${accessToken}`);

      let authProvider = new CognitoContext();

      const roles = await authProvider.getRoles(accessToken);

      logger.info(`Authentication Helper GET_ROLES RESULT: \n ${roles}`);

      return roles;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  async getApp(accessToken) {
    try {
      logger.info(`Authentication Helper GET_APP Request: \n ${accessToken}`);

      let authProvider = new CognitoContext();

      const app = await authProvider.getApp(accessToken);

      logger.info(`Authentication Helper GET_APP RESULT: \n ${app}`);

      return app;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  async getAuthId(accessToken) {
    try {
      logger.info(
        `Authentication Helper GET_AUTH_ID Request: \n ${accessToken}`
      );

      const authId = await this.authProvider.getAuthId(accessToken);

      logger.info(`Authentication Helper GET_AUTH_ID RESULT: \n ${authId}`);

      return authId;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }
}
