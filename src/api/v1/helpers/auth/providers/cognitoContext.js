// Import Cognito Service
import CognitoService from "../../../services/cognito.service.js";
// Import Authentication Utils
import AuthUtils from "../../../utils/auth/auth.utils.js";
// Import logger
import logger from "../../../../../logs/logger.js";
// Import errors helper
import * as Error from "../../../utils/errors/http/index.js";

/**
 * Crate a new instance of the Cognito Service.
 */
const cognitoService = new CognitoService();

/**
 * Crate a new instance of the AuthUtils.
 */
const authUtils = new AuthUtils();

/**
 * Class with utility functions for authentication with the Cognito Context.
 */
export default class CognitoContext {
  constructor(acessToken) {
    this.cognitoService = cognitoService;
    this.AuthUtils = authUtils;
    this.decodedAccessToken = this.AuthUtils.decodeJwtToken(acessToken);
  }

  /**
   * Retrieves the Cognito id from the JWT token.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<String>} Cognito id.
   */
  async getAuthId(accessToken) {
    try {
      logger.info(
        `Cognito Context Authentication Helper GET_AUTH_ID Request: \n ${accessToken}`
      );

      let cognitoId;

      if (this.decodedAccessToken != null) {
        cognitoId = this.decodedAccessToken.sub;
      } else {
        const decodeToken = await this.authUtils.decodeJwtToken(accessToken);
        this.decodedAccessToken = decodeToken;
        cognitoId = decodeToken.sub;
      }

      logger.info(
        `Cognito Context Authentication Helper GET_AUTH_ID RESULT: \n ${cognitoId}`
      );
      return cognitoId;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  /**
   * Retrieves the user data from Cognito.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<JSON>} User data.
   */
  async getAuthUser(accessToken) {
    try {
      logger.info(
        `Cognito Context Authentication Helper GET_AUTH_ID Request: \n ${accessToken}`
      );

      let user;

      if (this.decodedAccessToken != null) {
        // Get the user from cognito
        user = await this.cognitoService.getUser(this.decodedAccessToken.sub);
      } else {
        const decodeToken = await this.authUtils.decodeJwtToken(accessToken);
        this.decodedAccessToken = decodeToken;
        user = await this.cognitoService.getUser(decodeToken.sub);
      }

      logger.info(
        `Cognito Context Authentication Helper GET_AUTH_ID RESULT: \n ${JSON.stringify(
          user,
          null,
          2
        )}`
      );
      return user;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  /**
   * Retrieves all user roles from Cognito.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<Array<String>>} An array with all user roles.
   */
  async getRoles(accessToken) {
    try {
      logger.info(
        `Cognito Context Authentication Helper GET_ROLES Request: \n ${accessToken}`
      );

      let roles;

      if (this.decodedAccessToken != null) {
        roles = this.decodedAccessToken["cognito:groups"];
      } else {
        const decodeToken = await this.authUtils.decodeJwtToken(accessToken);
        this.decodedAccessToken = decodeToken;
        roles = decodeToken["cognito:groups"];
      }

      logger.info(
        `Cognito Context Authentication Helper GET_ROLES RESULT: \n ${JSON.stringify(
          roles,
          null,
          2
        )}`
      );
      return roles;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }

  /**
   * The app that the user has access.
   *
   * @param {String} accessToken  - JWT token.
   * @returns {Promise<String>} The app name.
   */
  async getApp(accessToken) {
    try {
      logger.info(
        `Cognito Context Authentication Helper GET_APP Request: \n ${accessToken}`
      );

      let app;
      let roles;

      if (this.decodedAccessToken != null) {
        // Get user roles
        roles = await this.getRoles(this.decodedAccessToken);

        // Check if the user has the role of an admin
        if (roles.includes("crm-user")) {
          app = "crm";
        } else if (roles.includes("marketplace-user")) {
          app = "marketplace";
        } else {
          throw new Error._403(
            `User doesn't have a valid role. Roles: ${roles}. Please contact us at: suporte@careplace.pt`
          );
        }
      } else {
        const decodeToken = await this.authUtils.decodeJwtToken(accessToken);
        this.decodedAccessToken = decodeToken;
        roles = await this.getRoles(decodeToken);

        // Check if the user has the role of an admin
        if (roles.includes("crm-user")) {
          app = "crm";
        } else if (roles.includes("marketplace-user")) {
          app = "marketplace";
        } else {
          throw new Error._403(
            `User doesn't have a valid role. Roles: ${roles}. Please contact us at: suporte@careplace.pt`
          );
        }
      }

      logger.info(
        `Cognito Context Authentication Helper GET_APP RESULT: \n ${app}`
      );
      return app;
    } catch (error) {
      throw new Error._500(`Internal Server Error: ${error}`);
    }
  }
}
