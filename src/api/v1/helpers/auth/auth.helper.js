// Import logger
import logger from "../../../../logs/logger.js";
// Import errors helper
import * as LayerError from "../../utils/errors/layer/index.js";
// Authentication Provider

import CognitoService from "../../services/cognito.service.js";

import authUtils from "../../utils/auth/auth.utils.js";

import {
  AWS_COGNITO_CRM_GROUPS,
  AWS_COGNITO_MARKETPLACE_GROUPS,
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from "../../../../config/constants/index.js";

import marketplaceUsersDao from "../../db/marketplaceUsers.dao.js";
import crmUsersDao from "../../db/crmUsers.dao.js";

let AuthUtils = new authUtils();

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
  constructor() {
    this.AuthUtils = AuthUtils;
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

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken["client_id"];

      let username = decodedToken["username"];

      let Cognito = new CognitoService(clientId);

      const authUser = await Cognito.adminGetUser(username);

      logger.info(
        `Authentication Helper GET_AUTH_USER RESULT: \n ${JSON.stringify(
          authUser,
          null,
          2
        )}`
      );

      return authUser;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }

  async getUserAttributes(accessToken) {
    try {
      logger.info(
        `Authentication Helper GET_USER_ATTRIBUTES Request: \n ${accessToken}`
      );

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken["client_id"];

      let username = decodedToken["username"];

      let Cognito = new CognitoService(clientId);

      const user = await Cognito.adminGetUser(username);

      let userAttributes = user.UserAttributes;

      logger.info(
        `Authentication Helper GET_USER_ATTRIBUTES RESULT: \n ${JSON.stringify(
          userAttributes,
          null,
          2
        )}`
      );

      return userAttributes;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
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

  async getClientId(accessToken) {
    try {
      logger.info(`Authentication Helper GET_APP Request: \n ${accessToken}`);

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken["client_id"];

      logger.info(`Authentication Helper GET_APP RESULT: \n ${clientId}`);

      return clientId;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }

  async getUserFromDB(accessToken) {
    try {
      logger.info(
        `Authentication Helper GET_USER_FROM_DB Request: \n ${accessToken}`
      );

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken["client_id"];

      let username = decodedToken["username"];

      let user;

      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        let CrmUsersDao = new crmUsersDao();
        user = await CrmUsersDao.query_one(
          {
            cognito_id: { $eq: username },
          },

          {
            path: "company",
            model: "Company",
          }
        );
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        let MarketplaceUsersDao = new marketplaceUsersDao();

        user = await MarketplaceUsersDao.query_one({
          cognito_id: { $eq: username },
        });
      }

      logger.info(`Authentication Helper GET_USER_FROM_DB RESULT: \n ${user}`);

      return user;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }
}
