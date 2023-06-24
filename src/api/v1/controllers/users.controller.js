// Import services
import cognitoService from '../services/cognito.service';
import SES from '../services/ses.service';

// Import DAOs
import crmUsersDAO from '../db/crmUsers.dao';
import caregiversDAO from '../db/caregivers.dao';
import marketplaceUsersDAO from '../db/marketplaceUsers.dao';
import companiesDAO from '../db/companies.dao';
import CRUD from './crud.controller';

import authUtils from '../utils/auth/auth.utils';
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from '../../../config/constants/index';

// Import Utils
import password from 'secure-random-password';
import emailHelper from '../helpers/emails/email.helper';
import stripe from '../services/stripe.service';
import authHelper from '../helpers/auth/auth.helper';
import SES_Service from '../services/ses.service';

// Import logger
import logger from '../../../logs/logger';

import * as Error from '../utils/errors/http/index';
import { response } from 'express';

const app = 'crm';

export default class UsersController {
  /**
   * @debug
   * @description
   */
  static async create(req, res, next) {
    // try {

    let response = {};

    const user = req.body;

    let clientID = AWS_COGNITO_CRM_CLIENT_ID;

    const CompaniesDAO = new companiesDAO();
    const UsersDAO = new crmUsersDAO();
    const CaregiversDAO = new caregiversDAO();
    const EmailHelper = new emailHelper();
    const CognitoService = new cognitoService(clientID);

    let SES = new SES_Service();

    let newCaregiver;
    let newUser;
    let temporaryPassword;
    let cognitoUser;

    logger.info('Users Controller CREATE: ' + JSON.stringify(request, null, 2) + '\n');

    logger.info('USER: ' + JSON.stringify(user, null, 2) + '\n');

    // Get the company from MongoDB.
    const company = await CompaniesDAO.retrieve(user.company);

    // Tried to add a user to a company that doesn't exist.
    if (!company) {
      response.statusCode = 400;
      response.data = {
        error: 'Company not found. User must be associated with an existing company.',
      };

      logger.error(
        'Company not found. User must be associated with an existing company.' +
          JSON.stringify(request, null, 2) +
          '\n'
      );

      return res.status(400).json({
        error: 'Company not found. User must be associated with an existing company.',
      });
    }

    // Remove any whitespace from the phone number.
    user.phone = user.phone.replace(/\s/g, '');

    if (user.permissions.includes('app_user')) {
      // Generate a random password of 8 characters.
      temporaryPassword = String(
        password.randomPassword({
          characters: [password.lower, password.upper, password.digits],
          length: 8,
        })
      );

      // Create a new user in the CRM Cognito User Pool.
      try {
        cognitoUser = await CognitoService.addUser(user.email, temporaryPassword, user.phone);
      } catch (err) {
        console.error('Error creating user in Cognito: ');
        console.error(err);
        switch (err.type) {
          case 'INVALID_PARAMETER': {
            console.error('Username already exists: ' + err);
            response.statusCode = 400;
            response.data = {
              error: 'EMAIL_ALREADY_EXISTS',
            };
            return next(response);
          }

          default: {
            logger.error('Internal Server Error: ' + err);
            response.statusCode = 500;
            response.data = {
              error: 'Internal Server Error.',
            };
            return next(response);
          }
        }
      }

      console.log('COGNITO USER: ' + JSON.stringify(cognitoUser, null, 2) + '\n');

      user.cognito_id = cognitoUser.UserSub;

      // Confirm the user in Cognito.
      const confirmUser = CognitoService.adminConfirmUser(user.email);

      // Error confirming user in Cognito.
      if (confirmUser.error != null) {
        request.statusCode = 400;
        request.response = { error: confirmUser.error.message };

        logger.error(
          'Error confirming user in Cognito: ' + JSON.stringify(request, null, 2) + '\n'
        );

        return res.status(400).json({ error: confirmUser.error.message });
      }
    }

    // If the user is a caregiver, add them to the caregivers collection.
    if (user.role == 'caregiver') {
      try {
        newCaregiver = await CaregiversDAO.create(user);
      } catch (err) {
        logger.error('Error creating caregiver in MongoDB: ' + err);
        response.statusCode = 500;
        response.data = {
          error: 'Internal Server Error.',
        };

        return next(response);
      }
    } else {
      try {
        // Add the user to the database.
        newUser = await UsersDAO.create(user);
      } catch (err) {
        logger.error('Error creating user in MongoDB: ' + err);
      }
    }

    // Error adding user to database.
    if (newUser?.error) {
      // Delete the user from Cognito.
      const deleteUser = await CognitoService.adminDeleteUser(app, user.email);

      // Delete the user from the database.
      const deleteMongoUser = await usersDAO.delete(user.email);

      request.statusCode = 400;
      request.response = { error: newUser.error };

      logger.error('Error adding user to database: ' + JSON.stringify(request, null, 2) + '\n');

      return res.status(400).json({ error: newUser.error });
    }

    response.statusCode = 201;
    response.data = newUser;

    next(response);

    if (user.permissions.includes('app_user')) {
      // Variables to be inserted into email template
      const emailData = {
        name: user.name,
        email: user.email,
        company: company.business_profile.name,
        password: temporaryPassword,
      };

      console.log('EMAIL DATA: ' + JSON.stringify(emailData, null, 2) + '\n');

      // Insert variables into email template
      let email = await EmailHelper.getEmailTemplateWithData('crm_new_user', emailData);

      // Send email to user
      SES.sendEmail([user.email], email.subject, email.htmlBody);
    }

    /**
       *   } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
    }
      */
  }

  /**
   * @debug
   * @description Returns the user information from the user id in the request params
   */
  static async retrieve(req, res, next) {
    try {
      const userId = req.params.id;

      let CrmUsersDAO = new crmUsersDAO();
      let CaregiversDAO = new caregiversDAO();
      let user;

      try {
        // Get user by id
        user = await CrmUsersDAO.retrieve(userId);
      } catch (error) {
        switch (error.type) {
          default:
            logger.warn('Error: ' + error);
        }
      }

      if (user == null) {
        try {
          user = await CaregiversDAO.retrieve(userId);
        } catch (error) {
          switch (error.type) {
            default:
              logger.warn('Error: ' + error);
          }
        }
      }

      if (user != null) {
        request.statusCode = 200;
        request.response = user;

        logger.info('Users Controller getUser result: ' + JSON.stringify(request, null, 2) + '\n');

        res.status(200).json(user);
      }

      // User does not exist
      else {
        request.statusCode = 404;
        request.response = { message: 'User does not exist.' };

        logger.warn('Users Controller getUser error: ' + JSON.stringify(request, null, 2) + '\n');

        res.status(404).json({ message: 'User does not exist.' });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error('Internal error: ' + JSON.stringify(request, null, 2) + '\n');

      return res.status(500).json(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async update(req, res, next) {
    try {
      let response = {};

      const userId = req.params.id;
      const user = req.body;
      let userExists;
      let updatedUser;
      let CrmUsersDAO = new crmUsersDAO();
      let CaregiversDAO = new caregiversDAO();
      let MarketplaceUsersDAO = new marketplaceUsersDAO();

      // Check if user already exists by verifying the id
      try {
        userExists = await CrmUsersDAO.retrieve(userId);

        // If user exists, update user
        if (userExists) {
          // The user to be updated is the user from the request body. For missing fields, use the user from the database.
          updatedUser = {
            ...userExists,
            ...user,
          };
          await CrmUsersDAO.update(updatedUser);
        }
      } catch (error) {
        try {
          userExists = await CaregiversDAO.retrieve(userId);
          if (userExists) {
            // The user to be updated is the user from the request body. For missing fields, use the user from the database.
            updatedUser = {
              ...userExists,
              ...user,
            };
            await CaregiversDAO.update(updatedUser);
          }
        } catch (error) {
          try {
            userExists = await MarketplaceUsersDAO.retrieve(userId);
            if (userExists) {
              // The user to be updated is the user from the request body. For missing fields, use the user from the database.
              updatedUser = {
                ...userExists,
                ...user,
              };
              await MarketplaceUsersDAO.update(updatedUser);
            }
          } catch (error) {
            switch (error.type) {
              default:
                logger.warn('Error: ' + error);
            }
          }
        }
      }

      if (!userExists) {
        response.statusCode = 400;
        response.response = { message: 'User does not exist.' };

        logger.warn(
          'Users Controller updateUser error: ' + JSON.stringify(response, null, 2) + '\n'
        );

        next(response);
      } else {
        // Update user

        if (updatedUser) {
          response.statusCode = 200;
          response.response = updatedUser;

          logger.info(
            'USERS-DAO UPDATE_USER RESULT: ' + JSON.stringify(updatedUser, null, 2) + '\n'
          );

          next(response);
        }
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async delete(req, res, next) {
    try {
      let response = {};
      let clientID = AWS_COGNITO_CRM_CLIENT_ID;

      const userId = req.params.id;

      if (!userId) {
        response.statusCode = 400;
        response.response = { message: 'User id is required.' };
        return next(response);
      }

      let CRMUsersDAO = new crmUsersDAO();
      let CaregiversDAO = new caregiversDAO();

      let user;
      let isDeleted = false;

      // Try to retrieve user from CRMUsersDAO first
      user = await CRMUsersDAO.retrieve(userId);

      if (!user) {
        // If user is not found in CRMUsersDAO, try to retrieve user from CaregiversDAO
        user = await CaregiversDAO.retrieve(userId);

        if (user) {
          try {
            // Delete user from CaregiversDAO
            await CaregiversDAO.delete(userId);
            isDeleted = true;
          } catch (error) {
            isDeleted = false;
          }
        }
      } else {
        try {
          await CRMUsersDAO.delete(userId);
          isDeleted = true;
        } catch (error) {
          isDeleted = false;
        }
      }

      // If the user has access to the CRM, delete the user from Cognito
      if (user?.cognito_id) {
        const CognitoService = new cognitoService(clientID);
        try {
          await CognitoService.adminDeleteUser(user.cognito_id);
        } catch (error) {
          throw new Error._500(`Error: ${error}`);
        }
      }

      // If user deletion is successful
      if (isDeleted) {
        response.statusCode = 200;
        response.data = { message: 'User deleted.' };

        logger.info(
          'Users Controller deleteUser result: ' + JSON.stringify(response, null, 2) + '\n'
        );
      } else {
        throw new Error._500(`Unable to delete user`);
      }

      next(response);
    } catch (error) {
      logger.error('Error: ', error);

      response.statusCode = 500;
      response.data = { error: error };
      next(response);
    }
  }

  static async listUsersByCompany(req, res, next) {
    try {
      let companyUsers = [];
      let AuthHelper = new authHelper();
      let CrmUsersDAO = new crmUsersDAO();
      let CaregiversDAO = new caregiversDAO();
      let companyId;

      let accessToken = req.headers.authorization.split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      companyId = user.company._id;

      let crmUsers = await CrmUsersDAO.queryList({
        company: companyId,
      });

      crmUsers = crmUsers.data;

      let caregivers = await CaregiversDAO.queryList({
        company: companyId,
      });

      caregivers = caregivers.data;

      for (let i = 0; i < crmUsers.length; i++) {
        companyUsers.push(crmUsers[i]);
      }

      for (let i = 0; i < caregivers.length; i++) {
        companyUsers.push(caregivers[i]);
      }

      response.statusCode = 200;
      response.data = companyUsers;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Returns the user information based on the token
   */
  static async account(req, res, next) {
    try {
      logger.info(`Users Controller ACCOUNT Request: \n ${JSON.stringify(req.body, null, 2)}`);

      let response = {};
      let responseAux = {};

      let cognitoId;
      let app;
      let accessToken;

      let cognitoResponse = {};

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let clientId = await AuthHelper.getClientId(accessToken);

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      cognitoId = userAttributes.find((attribute) => {
        return attribute.Name === 'sub';
      }).Value;

      let phoneVerified = userAttributes.find((attribute) => {
        return attribute.Name === 'phone_number_verified';
      }).Value;

      let emailVerified = userAttributes.find((attribute) => {
        return attribute.Name === 'email_verified';
      }).Value;

      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        app = 'crm';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      let user;

      try {
        if (app === 'crm') {
          let CrmUsersDAO = new crmUsersDAO();

          user = await CrmUsersDAO.queryOne(
            {
              cognito_id: "39425f3b-a637-4e6a-9db4-97fd2132a416" ,
            },
            [{
              path: 'company',
              model: 'Company',
              populate: [
                {
                  path: 'services',
                  model: 'Service',
                  select: '-__v -created_at -updated_at -translations',
                },
                {
                  path: 'team',
                  model: 'crm_user',
                  select: '-__v -createdAt -updatedAt -cognito_id -settings -company',
                },
              ],
              select: '-__v -createdAt -updatedAt',
            }]
          );
        } else if (app === 'marketplace') {
          let MarketplaceUsersDAO = new marketplaceUsersDAO();

          user = await MarketplaceUsersDAO.queryOne({
            cognito_id: { $eq: cognitoId },
          });
        }
      } catch (error) {
        switch (error.type) {
          case 'NOT_FOUND':
            throw new Error._404('User not found.');
          default:
            throw new Error._500(error);
        }
      }

      user = user.toJSON();

      /**
       * Get External Accounts from Stripe
       */
      let Stripe = new stripe();
      let connectedAccountId;
      let externalAccounts;
      if (app === 'crm' && user.company.stripe_information.account_id) {
        connectedAccountId = user.company.stripe_information.account_id;

        externalAccounts = await Stripe.listExternalAccounts(connectedAccountId);

        user.company.stripe_information.external_accounts = externalAccounts.data;
      }

      let customerId;
      let paymentMethods;

      /**
       * Get Payment Methods from Stripe
       */
      if (app === 'marketplace') {
        customerId = user.stripe_information.customer_id;

        const default_payment_method = (await Stripe.getCustomer(customerId)).default_source;

        user.stripe_information.default_payment_method = default_payment_method;
      }

      // Convert user to JSON

      user.phone_verified = phoneVerified;
      user.email_verified = emailVerified;
      delete user.createdAt;
      delete user.updatedAt;
      delete user.__v;
      delete user.cognito_id;

      response.statusCode = 200;
      response.data = user;

      next(response);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async updateAccount(req, res, next) {
    try {
      logger.info(`Users Controller ACCOUNT Request: \n ${JSON.stringify(req.body, null, 2)}`);

      let response = {};
      let responseAux = {};

      let cognitoId;
      let app;
      let accessToken;

      let cognitoResponse = {};

      /**
       * Delete fields that are not allowed to be updated
       */
      delete req.body._id;
      delete req.body.stripe_information;
      delete req.body.email_verified;
      delete req.body.phone_verified;
      delete req.body.cognito_id;
      delete req.body.createdAt;
      delete req.body.updatedAt;
      delete req.body.__v;
      delete req.body.company;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(' ')[1];
      } else {
        throw new Error._400('No authorization token provided.');
      }

      let AuthHelper = new authHelper();

      let clientId = await AuthHelper.getClientId(accessToken);

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      cognitoId = userAttributes.find((attribute) => {
        return attribute.Name === 'sub';
      }).Value;

      let phoneVerified = userAttributes.find((attribute) => {
        return attribute.Name === 'phone_number_verified';
      }).Value;

      let emailVerified = userAttributes.find((attribute) => {
        return attribute.Name === 'email_verified';
      }).Value;

      /**
       * Get App from Client ID (CRM or Marketplace)
       */
      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        app = 'crm';
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = 'marketplace';
      }

      let user;
      let updateUser;

      if (app === 'crm') {
        try {
          let CrmUsersDAO = new crmUsersDAO();

          user = await CrmUsersDAO.queryOne({
            cognito_id: { $eq: cognitoId },
          });

          console.log('USER: ', user.toJSON());
          console.log('REQ BODY: ', req.body);

          updateUser = {
            ...user.toJSON(),
            ...(req.body?.user || req.body),
          };
          console.log('UPDATE USER BEFORE: ', updateUser);

          updateUser = await CrmUsersDAO.update(updateUser);

          console.log('UPDATE USER: ', updateUser);

          user = updateUser;
        } catch (error) {
          console.log(error);
          switch (error.type) {
            case 'NOT_FOUND':
              throw new Error._404('User not found.');
            default:
              throw new Error._500(error);
          }
        }
      }

      if (app === 'marketplace') {
        try {
          let MarketplaceUsersDAO = new marketplaceUsersDAO();

          user = await MarketplaceUsersDAO.queryOne({
            cognito_id: { $eq: cognitoId },
          });

          updateUser = {
            ...user.toJSON(),
            ...req.body.user,
          };

          updateUser = await MarketplaceUsersDAO.update(updateUser);

          user = updateUser;
        } catch (error) {
          switch (error.type) {
            case 'NOT_FOUND':
              throw new Error._404('User not found.');
            default:
              throw new Error._500(error);
          }
        }
      }

      // Convert user to JSON

      user.phone_verified = phoneVerified;
      user.email_verified = emailVerified;
      delete user.createdAt;
      delete user.updatedAt;
      delete user.__v;
      delete user.cognito_id;

      response.statusCode = 200;
      response.data = user;

      next(response);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
}
