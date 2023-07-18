// aws
import { CognitoIdentityServiceProvider } from 'aws-sdk';

// Import logger
import logger from '@logger';
// Import errors helper
import { LayerError } from '@utils';
// Authentication Provider

import { CognitoService } from '@packages/services';

import AuthUtils from '../../utils/auth/auth.utils';

import { ICaregiverDocument, ICollaboratorDocument, ICustomerDocument } from '../../interfaces';

import {
  AWS_COGNITO_BUSINESS_GROUPS,
  AWS_COGNITO_MARKETPLACE_GROUPS,
  AWS_COGNITO_BUSINESS_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '@constants';

import CustomersDao from '../../database/customers.dao';
import CollaboratorsDAO from '../../database/collaborators.dao';
import { CaregiversDAO } from '../../database';
import { TClientID } from 'src/packages/interfaces/types';

/**
 * Class with utility functions for authentication.
 * AWS Cognito Context.
 */
export default class AuthHelper {
  //db
  static CollaboratorsDAO = new CollaboratorsDAO();
  static CustomersDAO = new CustomersDao();
  static CaregiversDAO = new CaregiversDAO();
  // utils
  static AuthUtils = AuthUtils;

  static async getClientIdFromAccessToken(accessToken: string): Promise<string> {
    logger.info(`Authentication Helper GET_CLIENT_ID_FROM_ACCESS_TOKEN Request: \n ${accessToken}`);

    let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

    let clientId = decodedToken['client_id'];

    if (!clientId) {
      throw new LayerError.INVALID_PARAMETER('Client id not found in token');
    }

    if (
      clientId !== AWS_COGNITO_BUSINESS_CLIENT_ID &&
      clientId !== AWS_COGNITO_MARKETPLACE_CLIENT_ID
    ) {
      throw new LayerError.INVALID_PARAMETER('Invalid client id');
    }

    logger.info(`Authentication Helper GET_CLIENT_ID_FROM_ACCESS_TOKEN RESULT: \n ${clientId}`);

    return clientId;
  }

  /**
   * Retrieves the Cognito id from the JWT token.
   *
   * @param {String} accessToken - JWT token.
   * @returns {Promise<String>} Cognito id.
   */
  static async getAuthUser(
    accessToken: string
  ): Promise<CognitoIdentityServiceProvider.AdminGetUserResponse> {
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
  }

  static async getUserAttributes(
    accessToken: string
  ): Promise<CognitoIdentityServiceProvider.AttributeListType | undefined> {
    logger.info(`Authentication Helper GET_USER_ATTRIBUTES Request: \n ${accessToken}`);

    let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

    let clientId = decodedToken['client_id'] as string;

    let username = decodedToken['username'] as string;

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
  }

  static async getAuthId(accessToken: string): Promise<string> {
    logger.info(`Authentication Helper GET_AUTH_ID Request: \n ${accessToken}`);

    const user = await this.getAuthUser(accessToken);

    const authId = user.Username;

    logger.info(`Authentication Helper GET_AUTH_ID RESULT: \n ${authId}`);

    return authId;
  }

  static async getAppId(accessToken: string): Promise<'business' | 'marketplace'> {
    logger.info(`Authentication Helper GET_APP Request: \n ${accessToken}`);

    let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

    let clientId = decodedToken['client_id'] as string;

    let appId: 'business' | 'marketplace';

    if (clientId === AWS_COGNITO_BUSINESS_CLIENT_ID) {
      appId = 'business';
    } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
      appId = 'marketplace';
    } else {
      throw new LayerError.INVALID_PARAMETER('Invalid Client Id.');
    }

    logger.info(`Authentication Helper GET_APP RESULT: \n ${appId}`);

    return appId;
  }

  static async getUserFromDB(
    accessToken: string
  ): Promise<ICollaboratorDocument | ICaregiverDocument | ICustomerDocument> {
    logger.info(`Authentication Helper GET_USER_FROM_DB Request: \n ${accessToken}`);

    let decodedToken = await this.AuthUtils.decodeJwtToken(accessToken);

    let clientId = decodedToken['client_id'];

    let username = decodedToken['username'];

    let user: ICollaboratorDocument | ICaregiverDocument | ICustomerDocument;

    if (clientId === AWS_COGNITO_BUSINESS_CLIENT_ID) {
      try {
        user = await this.CollaboratorsDAO.queryOne(
          {
            cognito_id: { $eq: username },
          },

          {
            path: 'health_unit',
            model: 'HealthUnit',
          }
        );
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            // Users that have access to the business app can be either collaborators or caregivers.
            user = await this.CaregiversDAO.queryOne(
              {
                cognito_id: { $eq: username },
              },
              {
                path: 'health_unit',
                model: 'HealthUnit',
              }
            );
            break;
          default:
            throw new LayerError.INTERNAL_ERROR(error.message);
        }
      }
    } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
      user = await this.CustomersDAO.queryOne({
        cognito_id: { $eq: username },
      });
    } else {
      throw new LayerError.INVALID_PARAMETER('Invalid Client Id.');
    }

    logger.info(`Authentication Helper GET_USER_FROM_DB RESULT: \n ${user}`);

    return user;
  }
}
