// Import services
import CognitoService from "../services/cognito.service.js";
import SES from "../services/ses.service.js";

// Import DAOs
import usersDAO from "../db/users.dao.js";
import companiesDAO from "../db/companies.dao.js";

// Import Helpers
import AuthHelper from "../helpers/auth/auth.helper.js";

// Import Utils
import password from "secure-random-password";
import EmailHelper from "../helpers/emails/email.helper.js";



// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";

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

    logger.info( 
      "Temporary password: " + temporaryPassword + "\n");

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
      user.phoneNumber,
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

  /**
   * @description Returns an array of Caregivers of a Company that are available for the given order. In the request params the order id is passed. The order id is used to get the order information. The order information is used to get the company id. The company id is used to get the caregivers of the company. The id of the caregivers are used to get the caregiver information and their events. The events are used to check if the caregiver is available for the given order. The caregivers that are available are returned. 
   */
  static async availableCaregivers(req, res, next) {

    var request = requestUtils(req);

    logger.info(
      "Users Controller availableCaregivers: " +
        JSON.stringify(request, null, 2) +
        "\n"
    );

    try {
      const orderId = req.params.orderId;

      // Get order information
      const order = await ordersDAO.get_one(orderId);

      // Order found
      if (order) {
        // Get company id
        const companyId = order.companyId;

        // Get caregivers of the company
        const caregivers = await usersDAO.get_caregivers(companyId);

        // Caregivers found
        if (caregivers) {
          // Array of available caregivers
          const availableCaregivers = [];

          // Iterate through the caregivers
          for (let i = 0; i < caregivers.length; i++) {
            // Get caregiver information
            const caregiver = await usersDAO.get_one(caregivers[i]._id);

            // Get caregiver events
            const events = await eventsDAO.get_events_by_user_id(
              caregivers[i]._id
            );

            // Check if the caregiver is available for the given order
            const available = await this.isAvailable(
              caregiver,
              events,
              order.start,
              order.end
            );

            // Caregiver is available
            if (available) {
              // Add caregiver to the array of available caregivers
              availableCaregivers.push(caregiver);
            }
          }

          request.statusCode = 200;
          request.response = availableCaregivers;

          logger.info(
            "USERS-DAO AVAILABLE_CAREGIVERS RESULT: " +
              JSON.stringify(availableCaregivers, null, 2) +
              "\n"
          );

          // Return the array of available caregivers
          res.status(200).json(availableCaregivers);
        }
        // No caregivers found
        else {
          request.statusCode = 404;
          request.response = { message: "No caregivers found." };

          logger.warn(
            "Users Controller availableCaregivers error: " +
              JSON.stringify(request, null, 2) +
              "\n"
          );

          res.status(404).json({ message: "No caregivers found." });
        }
      }
      // Order not found
      else {
        request.statusCode = 404;
        request.response = { message: "Order not found." };

        logger.warn(
          "Users Controller availableCaregivers error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        res.status(404).json({ message: "Order not found." });

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

}
