// Import services
import CognitoService from "../services/cognito.service.js";
import SES from "../services/ses.service.js";

// Import DAOs
import crmUsersDAO from "../db/crmUsers.dao.js";
import caregiversDAO from "../db/caregivers.dao.js";
import marketplaceUsersDAO from "../db/marketplaceUsers.dao.js";
import companiesDAO from "../db/companies.dao.js";
import CRUD from "./crud.controller.js";

import authUtils from "../utils/auth/auth.utils.js";
import {
  AWS_COGNITO_CRM_CLIENT_ID,
  AWS_COGNITO_MARKETPLACE_CLIENT_ID,
} from "../../../config/constants/index.js";

// Import Utils
import password from "secure-random-password";
import EmailHelper from "../helpers/emails/email.helper.js";
import stripe from "../services/stripe.service.js";
import authHelper from "../helpers/auth/auth.helper.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";

import * as Error from "../utils/errors/http/index.js";
import { response } from "express";

const app = "crm";

export default class UsersController {
  /**
   * @debug
   * @description
   */
  static async index(req, res, next) {
    try {
      var request = requestUtils(req);

      let filters = {};
      let options = {};
      let page = req.query.page != null ? req.query.page : null;
      let mongodbResponse;

      logger.info(
        "Users Controller INDEX: " + JSON.stringify(request, null, 2) + "\n"
      );

      // If the companyId query parameter is not null, then we will filter the results by the companyId query parameter.
      if (req.query.companyId) {
        filters.companyId = req.query.companyId;
      }

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy) {
        // If the sortOrder query parameter is not null, then we will sort the results by the sortOrder query parameter.
        // Otherwise, we will by default sort the results by ascending order.
        options.sort = {
          [req.query.sortBy]: req.query.sortOrder == "desc" ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }

      logger.info(
        "Attempting to get users from MongoDB: " +
          JSON.stringify(
            {
              filters: filters,
              options: options,
              page: page,
            },
            null,
            2
          ) +
          "\n"
      );

      // Get the users from MongoDB.
      mongodbResponse = await usersDAO.get_list(filters, options, page);

      // If there is an error, then we will return the error.
      if (mongodbResponse.error != null) {
        request.statusCode = 400;
        request.response = { error: mongodbResponse.error.message };

        logger.error(
          "Error fetching users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).json({ error: mongodbResponse.error.message });
      }
      // Otherwise, we will return the users.
      else {
        request.statusCode = 200;
        request.response = mongodbResponse;

        /** 
         * logger.info(
          "Successfully fetched users from MongoDB: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );
        */

        return res.status(200).json(mongodbResponse);
      }
    } catch (error) {
      // If there is an internal error, then we will return the error.
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json({ error: error });
    }
  }

  /**
   * @debug
   * @description
   */
  static async create(req, res, next) {
    // try {
    var request = requestUtils(req);

    const user = req.body;

    logger.info(
      "Users Controller CREATE: " + JSON.stringify(request, null, 2) + "\n"
    );

    // Generate a random password of 8 characters.
    const temporaryPassword = String(
      password.randomPassword({
        characters: [password.lower, password.upper, password.digits],
        length: 8,
      })
    );

    logger.info("Temporary password: " + temporaryPassword + "\n");

    if (user.role == "admin") {
      return res.status(400).json({ error: "Cannot create admin user." });
    }

    // Get the company from MongoDB.
    const company = await companiesDAO.get_one(user.company);

    // Tried to add a user to a company that doesn't exist.
    if (company == null) {
      request.statusCode = 400;
      request.response = {
        error:
          "Company not found. User must be associated with an existing company.",
      };

      logger.error(
        "Company not found. User must be associated with an existing company." +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      return res.status(400).json({
        error:
          "Company not found. User must be associated with an existing company.",
      });
    }

    // Create a new user in Cognito.
    const cognitoUser = await CognitoService.addUser(
      app,
      user.email,
      temporaryPassword,
      user.phoneNumber
    );

    // Error creating user in Cognito.
    if (cognitoUser.error != null) {
      request.statusCode = 400;
      request.response = { error: cognitoUser.error.message };

      logger.error(
        "Error creating user in Cognito: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      return res.status(400).json({ error: cognitoUser.error.message });
    }

    logger.info("COGNITO USER: " + JSON.stringify(cognitoUser, null, 2) + "\n");

    user.cognitoId = cognitoUser.UserSub;

    // Confirm the user in Cognito.
    const confirmUser = CognitoService.adminConfirmUser(app, user.email);

    // Error confirming user in Cognito.
    if (confirmUser.error != null) {
      request.statusCode = 400;
      request.response = { error: confirmUser.error.message };

      logger.error(
        "Error confirming user in Cognito: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      return res.status(400).json({ error: confirmUser.error.message });
    }

    // If there is no error, then the user has been confirmed.
    if (confirmUser.error == null) {
      user.emailVerified = true;
    }

    // Add the user to the database.
    const newUser = await usersDAO.add(user);

    // Error adding user to database.
    if (newUser.error != null) {
      // Delete the user from Cognito.
      const deleteUser = await CognitoService.adminDeleteUser(app, user.email);

      // Delete the user from the database.
      const deleteMongoUser = await usersDAO.delete(user.email);

      request.statusCode = 400;
      request.response = { error: newUser.error };

      logger.error(
        "Error adding user to database: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      return res.status(400).json({ error: newUser.error });
    }

    // Add the new user to the company.

    const addCompanyUser = await companiesDAO.add_user(
      user.company._id,
      newUser._id
    );

    // Variables to be inserted into email template
    const emailData = {
      name: user.name,
      email: user.email,
      password: temporaryPassword,
      company: company.name,
      gender: user.gender,
    };

    // Insert variables into email template
    let email = await EmailHelper.getEmailWithData("crm_new_user", emailData);

    // logger.info("EMAIL: " + JSON.stringify(email, null, 2) + "\n");

    // Send email to user
    SES.sendEmail(user.email, email.subject, email.body);

    res.status(201).json(newUser);

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
      var request = requestUtils(req);

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
            logger.warn("Error: " + error);
        }
      }

      if (user == null) {
        try {
          user = await CaregiversDAO.retrieve(userId);
        } catch (error) {
          switch (error.type) {
            default:
              logger.warn("Error: " + error);
          }
        }
      }

      if (user != null) {
        request.statusCode = 200;
        request.response = user;

        logger.info(
          "Users Controller getUser result: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        res.status(200).json(user);
      }

      // User does not exist
      else {
        request.statusCode = 404;
        request.response = { message: "User does not exist." };

        logger.warn(
          "Users Controller getUser error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        res.status(404).json({ message: "User does not exist." });
      }
    } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

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
                logger.warn("Error: " + error);
            }
          }
        }
      }

      if (!userExists) {
        response.statusCode = 400;
        response.response = { message: "User does not exist." };

        logger.warn(
          "Users Controller updateUser error: " +
            JSON.stringify(response, null, 2) +
            "\n"
        );

        next(response);
      } else {
        // Update user

        if (updatedUser) {
          response.statusCode = 200;
          response.response = updatedUser;

          logger.info(
            "USERS-DAO UPDATE_USER RESULT: " +
              JSON.stringify(updatedUser, null, 2) +
              "\n"
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
      var request = requestUtils(req);

      const userId = req.params.userId;

      // Check if user already exists by verifying the id
      const userExists = await usersDAO.getUserById(userId);
      if (!userExists) {
        return res.status(400).send("User does not exist");
      }

      const deletedUser = await usersDAO.deleteUser(userId);

      res.status(200).json(deletedUser);
    } catch (error) {
      next(error);
    }
  }

  static async listUsersByCompany(req, res, next) {
    try {
      let companyUsers = [];
      let AuthHelper = new authHelper();
      let CrmUsersDAO = new crmUsersDAO();
      let CaregiversDAO = new caregiversDAO();
      let companyId;

      let accessToken = req.headers.authorization.split(" ")[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      companyId = user.company._id;

      let crmUsers = await CrmUsersDAO.query_list({
        company: companyId,
      });

      let caregivers = await CaregiversDAO.query_list({
        company: companyId,
      });

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
      logger.info(
        `Users Controller ACCOUNT Request: \n ${JSON.stringify(
          req.body,
          null,
          2
        )}`
      );

      let response = {};
      let responseAux = {};

      let cognitoId;
      let app;
      let accessToken;

      let cognitoResponse = {};

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._400("No authorization token provided.");
      }

      let AuthHelper = new authHelper();

      let clientId = await AuthHelper.getClientId(accessToken);

      let userAttributes = await AuthHelper.getUserAttributes(accessToken);

      cognitoId = userAttributes.find((attribute) => {
        return attribute.Name === "sub";
      }).Value;

      let phoneVerified = userAttributes.find((attribute) => {
        return attribute.Name === "phone_number_verified";
      }).Value;

      let emailVerified = userAttributes.find((attribute) => {
        return attribute.Name === "email_verified";
      }).Value;

      if (clientId === AWS_COGNITO_CRM_CLIENT_ID) {
        app = "crm";
      } else if (clientId === AWS_COGNITO_MARKETPLACE_CLIENT_ID) {
        app = "marketplace";
      }

      let user;

      try {
        if (app === "crm") {
          let CrmUsersDAO = new crmUsersDAO();

          user = await CrmUsersDAO.query_one(
            {
              cognito_id: { $eq: cognitoId },
            },
            {
              path: "company",
              model: "Company",
              populate: [
                {
                  path: "services",
                  model: "Service",
                  select: "-__v -created_at -updated_at -translations",
                },
                {
                  path: "team",
                  model: "crm_users",
                  select:
                    "-__v -createdAt -updatedAt -cognito_id -settings -company",
                },
              ],
              select: "-__v -createdAt -updatedAt",
            }
          );
        } else if (app === "marketplace") {
          let MarketplaceUsersDAO = new marketplaceUsersDAO();

          user = await MarketplaceUsersDAO.query_one({
            cognito_id: { $eq: cognitoId },
          });
        }
      } catch (error) {
        switch (error.type) {
          case "NOT_FOUND":
            throw new Error._404("User not found.");
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
      if (app === "crm" && user.company.stripe_information.account_id) {
        connectedAccountId = user.company.stripe_information.account_id;

        externalAccounts = await Stripe.listExternalAccounts(
          connectedAccountId
        );

        user.company.stripe_information.external_accounts =
          externalAccounts.data;
      }

      let customerId;
      let paymentMethods;
      if (app === "marketplace") {
        customerId = user.stripe_information.customer_id;
        paymentMethods = await Stripe.listPaymentMethods(customerId, "card");

        logger.info(
          "Payment Methods: " + JSON.stringify(paymentMethods, null, 2)
        );

        user.stripe_information.payment_methods = paymentMethods;
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
