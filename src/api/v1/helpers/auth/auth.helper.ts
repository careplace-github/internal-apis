// Import logger
import logger from '../../../../logs/logger';
// Import errors helper
import { LayerError } from '@api/v1/utils';
// Authentication Provider

import CognitoService from '../../services/cognito.service';

import AuthUtils from '../../utils/auth/auth.utils';

import { ICognitoUser } from '../../interfaces';

import {
  AWS_COGNITO_CRM_GROUPS,
  AWS_COGNITO_MARKETPLACE_GROUPS,
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../../config/constants/index';

import CustomersDao from '../../db/customers.dao';
import CollaboratorsDAO from '../../db/collaborators.dao';

/**
 * Class with utility functions for authentication.
 * AWS Cognito Context.
 */
export default class AuthHelper {
  //db
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CustomersDAO = new CustomersDao();
  // utils
  static AuthUtils = AuthUtils;

  /**
   * Retrieves the Cognito id from the JWT token.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<String>} Cognito id.
   */
  static async getAuthUser(accessToken: string): Promise<ICognitoUser> {
    try {
      logger.info(`Authentication Helper GET_AUTH_USER Request: \n ${accessToken}`);

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken['client_id'];

      let username = decodedToken['username'];

      let Cognito = new CognitoService(clientId);

      const authUser = await Cognito.adminGetUser(username);

      logger.info(
        `Authentication Helper GET_AUTH_USER RESULT: \n ${JSON.stringify(authUser, null, 2)}`
      );

      return authUser;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }

  static async getUserAttributes(accessToken: string) {
    try {
      logger.info(`Authentication Helper GET_USER_ATTRIBUTES Request: \n ${accessToken}`);

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken['client_id'];

      let username = decodedToken['username'];

      let Cognito = new CognitoService(clientId);

      const user = (await Cognito.adminGetUser(username)) as ICognitoUser;

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

  static async getAuthId(accessToken: string) {
    try {
      logger.info(`Authentication Helper GET_AUTH_ID Request: \n ${accessToken}`);

      const user = await this.getAuthUser(accessToken);

      const authId = user.Username;

      logger.info(`Authentication Helper GET_AUTH_ID RESULT: \n ${authId}`);

      return authId;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }

  static async getClientId(accessToken: string) {
    try {
      logger.info(`Authentication Helper GET_APP Request: \n ${accessToken}`);

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken['client_id'];

      logger.info(`Authentication Helper GET_APP RESULT: \n ${clientId}`);

      return clientId;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(`Internal Server Error: ${error}`);
    }
  }

  static async getUserFromDB(accessToken: string) {
    try {
      logger.info(`Authentication Helper GET_USER_FROM_DB Request: \n ${accessToken}`);

      let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

      let clientId = decodedToken['client_id'];

      let username = decodedToken['username'];

      let user;

      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        user = await this.CollaboratorsDAO.queryOne(
          {
            cognito_id: { $eq: username },
          },

          {
            path: 'health_unit',
            model: 'HealthUnit',
          }
        );
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        user = await this.CustomersDAO.queryOne({
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
