// Import services
import CognitoService from "../services/cognito.service.js";
import SES from "../services/ses.service.js";

// Import DAOs
import usersDAO from "../db/usersDAO.js";
import companiesDAO from "../db/companiesDAO.js";

// Import Helpers
import AuthHelper from "../helpers/auth.helper.js";

// Import Utils
import password from "secure-random-password";
import EmailUtils from "../utils/email.utils.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";
import { APP_url } from "../../../config/constants/index.js";
import { stringify } from "querystring";

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
      if (req.query.companyId != null) {
        filters.companyId = req.query.companyId;
      }

      // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
      if (req.query.sortBy != null) {
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
        characters: [
          password.lower,
          password.upper,
          password.digits,
        ],
        length: 8,
      })
    );

    const company = await companiesDAO.get_one(user.companyId);

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
      temporaryPassword
    );

    logger.info("COGNITO USER: " + JSON.stringify(cognitoUser, null, 2) + "\n");

    user.cognitoId = cognitoUser.UserSub;

    // Confirm the user in Cognito.
   const confirmUser = CognitoService.adminConfirmUser(app, user.email);

    if(confirmUser.error == null){
      user.verified = true;
    }

    // Add the user to the database.
    const newUser = await usersDAO.add(user);

    // Variables to be inserted into email template
    const emailData = {
      name: user.name,
      email: user.email,
      password: temporaryPassword,
      company: company.name,
      gender: user.gender,
    };

    // Insert variables into email template
    let email = await EmailUtils.getEmailWithData("crm_new_user", emailData);

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
  static async show(req, res, next) {
    try {
      var request = requestUtils(req);

      const userId = req.params.id;

      // Get user by id
      const user = await usersDAO.get_one(userId);

      // User found
      if (user) {
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

  static async;

  /**
   * @debug
   * @description
   */
  static async update(req, res, next) {
    try {
      var request = requestUtils(req);

      logger.info(
        "Users Controller updateUser: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      const userId = req.params.id;
      const user = req.body;

      // Check if user already exists by verifying the id
      const userExists = await usersDAO.getUserById(userId);
      if (!userExists) {
        request.statusCode = 400;
        request.response = { message: "User does not exist." };

        logger.warn(
          "Users Controller updateUser error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).send("User does not exist");
      } else {
        // Update user
        const updatedUser = await usersDAO.updateUser(userId, user);

        if (updatedUser) {
          request.statusCode = 200;
          request.response = updatedUser;

          logger.info(
            "USERS-DAO UPDATE_USER RESULT: " +
              JSON.stringify(updatedUser, null, 2) +
              "\n"
          );

          res.status(200).json(updatedUser);
        }

        request.statusCode = 200;
        request.response = updatedUser;

        logger.info(
          "USERS-DAO UPDATE_USER RESULT: " +
            JSON.stringify(updatedUser, null, 2) +
            "\n"
        );

        res.status(200).json(updatedUser);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @debug
   * @description
   */
  static async destroy(req, res, next) {
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

  /**
   * @description Returns the user information based on the token
   */
  static async account(req, res, next) {
    //  try {
    var request = requestUtils(req);

    logger.info(
      "Users Controller getAccount: " + JSON.stringify(request, null, 2) + "\n"
    );

    const token = req.headers.authorization.split(" ")[1];

    const authId = await AuthHelper.getAuthId(token, "cognito");

    const user = await usersDAO.get_one_by_auth_id(authId, "cognito");

    // User found
    if (user) {
      console.log("1");
      // The role user is the only role that does not have a company
      if (user.role != "user") {
        // Find the company associated with the user
        const company = await companiesDAO.get_one(user.companyId);

        console.log("COMPANY: " + company + "\n");

        console.log("2");

        // Comapny fetched successfully
        if (company) {
          console.log("3");
          // User populated with company information
          user.company = company;
        }
      }

      request.statusCode = 200;
      request.response = user;

      logger.info(
        "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
          JSON.stringify(user, null, 2) +
          "\n"
      );

      // Return the user with company information
      res.status(200).json(user);
    }
    // User not found
    else {
      request.statusCode = 404;
      request.response = { message: "Couldn't fetch user account." };

      logger.warn(
        "Users Controller getAccount error: " +
          JSON.stringify(request, null, 2) +
          "\n"
      );

      res.status(404).json({ message: "Couldn't fetch user account." });
    }

    /**
       *  } catch (error) {
      request.statusCode = 500;
      request.response = { error: error };

      logger.error(
        "Internal error: " + JSON.stringify(request, null, 2) + "\n"
      );

      return res.status(500).json(error);
    }
       */
  }
}
