import {
  MONGODB_db_active,
  MONGODB_db_deletes,
  MONGODB_collection_users,
} from "../../../config/constants/index.js";

import mongodb from "mongodb";
import mongoose from "mongoose";

// Import the user schema
//import User from "../models/auth/user.model.js";
import userSchema from "../models/userLogic/users.model.js";

// Import logger
import logger from "../../../logs/logger.js";

let users;
let User;
const ObjectId = mongodb.ObjectId;

/**
 * @class Class to manage the users collection.
 */
export default class usersDAO {
  /**
   * @description Creates the connection to the MongoDB database.
   * @param {mongoose} connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectCollection(conn) {
    if (users) {
      return;
    }
    try {
      User = await conn.model("User", userSchema);

      // users = await conn.collection(MONGODB_collection_users);
      // User = mongoose.model("User", userSchema);
      // await connection.model("users", User);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in usersDAO: ${error}`
      );
      return { error: error };
    }
  }
  /**
   * @description Fetches a user/s by the query.
   * @param {JSON} filters - Query to search for the user/s.
   * @param {JSON} options - Options to search for the user/s.
   * @param {Integer} page - Page to search for the user/s.
   * @param {Integer} documentsPerPage - Documents per page to search for the user/s.
   * @returns {Promise<JSON>} - User/s information.
   */
  static async get_list(filters, options, page, documentsPerPage) {
    try {
      logger.info("USERS-DAO GET_USERS_BY_QUERY STARTED: ");

      logger.info(
        "USERS-DAO GET_USERS_BY_QUERY SEARCH: " +
          JSON.stringify(
            {
              filters: filters,
              options: this.options,
              page: page,
              documentsPerPage: documentsPerPage,
            },
            null,
            2
          ) +
          "\n"
      );

      let query = {};

      if (filters) {
        if (filters.companyId) {
          query = { companyId: ObjectId(filters.companyId) };
        }
      }

      // return User.find();

      let users = await User.find(query, options);

      // User/s found
      if (users) {
        // console.log("PAGE:"+ page != null)

        if (page != null) {
          let cursor = await users;

          const totalDocuments = await cursor.count();

          const documentsPerPage = this.documentsPerPage || 10;

          const totalPages = Math.ceil(totalDocuments / documentsPerPage) - 1;

          const displayCursor = cursor
            .limit(documentsPerPage)
            .skip(documentsPerPage * page);
          const documents = await displayCursor.toArray();

          logger.info(
            "USERS-DAO GET_USERS_BY_QUERY RESULT: " +
              JSON.stringify({ documents, totalPages }, null, 2) +
              "\n"
          );

          return { documents, totalPages };
        } else {
          logger.info(
            "USERS-DAO GET_USERS_BY_QUERY RESULT: " +
              JSON.stringify(users, null, 2) +
              "\n"
          );

          return users;
        }
      }
      // User/s not found
      else {
        logger.info("USERS-DAO GET_USERS_BY_QUERY USER NOT FOUND" + "\n");
        return { error: "User not found" };
      }
    } catch (error) {
      logger.error("USERS-DAO GET_USERS_BY_QUERY ERROR: " + error + "\n");
      return { error: error };
    }
  }

  /**
   * @description Inserts a new user in the database.
   * @param {User} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async add(user) {
    // try {
    logger.info("USERS-DAO ADD_USER STARTED: ");

    logger.info(JSON.stringify(user, null, 2) + "\n");

    // Save the user in the database

    const userExists = await this.get_one_by_email(user.email);

    // Check if user already exists in the database with the same email. If so, return an error.
    if (userExists.error == null) {
      logger.info(
        "USERS-DAO ADD_USER ERROR: " +
          JSON.stringify(
            { error: `User already exists with emaiL: \n` },
            null,
            2
          ) +
          "\n"
      );
      return {
        error: "User already exists with email: " + user.email + "\n",
      };
    }
    // If user does not exist, insert it in the database.
    else {
      // User schema
      const newUser = await User.create({
        _id: new ObjectId(),
        cognitoId: user.cognitoId,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        phoneNumberCountryCode: user.phoneNumberCountryCode,
        address: user.address,
        companyId: user.companyId,
        role: user.role || "user", // Default role is user
        company: user.company,
        gender: user.gender,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
      });

      const mongodbResponse = await newUser.save();

      logger.info(
        "USERS-DAO ADD_USER RESULT:: " +
          JSON.stringify(mongodbResponse, null, 2) +
          "\n"
      );

      // User inserted
      return mongodbResponse;
    }

    /**
       *  } catch (error) {
      logger.error(
        "USERS-DAO ADD_USER ERROR: " + JSON.stringify(error, null, 2) + "\n"
      );

      return { error: error };
    }
       */
    // Internal error
  }

  /**
   * @description Fetches the user information by the user id. If the user is associated with a company, the company information is also included.
   * @param {String} userId - User id from the database.
   * @returns {Promise<JSON>} - User information.
   */
  static async get_one(userId) {
    // try {
    logger.info("USERS-DAO GET_USER_BY_ID STARTED: ");

    logger.info("USERS-DAO GET_USER_BY_ID userId: " + userId + "\n");

    const user = await User.findById(userId).populate("company");

    //  user.populate("file")

    return user;

    // User found
    if (mongodbResponse) {
      // The role "user" is the only role that is not associated with a company

      logger.info(
        "USERS-DAO GET_USER_BY_ID RESULT: " +
          JSON.stringify(mongodbResponse, null, 2) +
          "\n"
      );

      return user;

      // User not found
    } else {
      logger.info("USERS-DAO GET_USER_BY_ID USER NOT FOUND" + "\n");
      return { error: "User not found" };
    }

    /**
       *  } catch (error) {
      logger.error("USERS-DAO GET_USER_BY_ID ERROR: " + error + "\n");
      return { error: error };
    }
       */
  }

  /**
   * @description Updates the user information in the database.
   * @param {*} userId - User id from the database.
   * @param {*} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async set(userId, user) {
    try {
      logger.info("USERS-DAO UPDATE_USER STARTED: ");

      logger.info("USERS-DAO UPDATE_USER userId: " + userId);
      logger.info(
        "USERS-DAO UPDATE_USER user: " + JSON.stringify(user, null, 2) + "\n"
      );

      const mongodbResponse = await users.updateOne(
        { _id: ObjectId(userId) },
        { $set: user }
      );

      // User updated
      if (mongodbResponse.modifiedCount === 1) {
        logger.info(
          "USERS-DAO UPDATE_USER RESULT: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return mongodbResponse;
      }
      // User not updated
      else {
        logger.info(
          "USERS-DAO UPDATE_USER ERROR: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return { error: mongodbResponse };
      }
    } catch (error) {
      logger.error(
        "USERS-DAO UPDATE_USER ERROR: " + JSON.stringify(error, null, 2) + "\n"
      );
      return { error: error };
    }
  }

  /**
   * @description Deletes the user from the database.
   * @param {*} userId - User id from the database.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async delete(userId) {
    try {
      logger.info("USERS-DAO DELETE_USER STARTED: ");

      logger.info("USERS-DAO DELETE_USER userId: " + userId + "\n");

      const mongodbResponse = await users.deleteOne({ _id: ObjectId(userId) });

      // User deleted
      if (mongodbResponse.deletedCount === 1) {
        logger.info(
          "USERS-DAO DELETE_USER RESULT: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return mongodbResponse;
      }
      // User not deleted
      else {
        logger.info(
          "USERS-DAO DELETE_USER ERROR: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return { error: mongodbResponse };
      }
    } catch (error) {
      logger.error(
        "USERS-DAO DELETE_USER ERROR: " + JSON.stringify(error, null, 2) + "\n"
      );
      return { error: error };
    }
  }

  static async get_one_by_auth_id(authId, authProvider) {
    try {
      logger.info("USERS-DAO GET_USER_BY_AUTH_ID STARTED: ");

      logger.info("USERS-DAO GET_USER_BY_AUTH_ID authId: " + authId + "\n");

      let mongodbResponse;

      switch (authProvider) {
        case "cognito":
          mongodbResponse = await User.findOne({ cognitoId: authId })
            .populate({
              path: "company",
              populate: [
                {
                  path: "team",
                  model: "User",
                  select:
                    "-__v -cognitoId -company -createdAt -updatedAt -services -relatives -settings",
                  populate: {
                    path: "caregiverInformation",
                    model: "Caregiver",
                    select: "-user, -__v -createdAt -updatedAt",
                    populate: {
                      path: "services",
                      model: "Service",
                      select: "-__v -createdAt -updatedAt -translations",
                    },
                  },
                },

                {
                  path: "services",
                  model: "Service",
                  select: "-__v -createdAt -updatedAt",
                },
                {
                  path: "contactInformation.owner",
                  model: "User",
                  select:
                    "-__v -cognitoId -company -createdAt -updatedAt -services -relatives -settings",
                },
              ],
              select: "-__v -createdAt -updatedAt",
            })
            .select("-__v -cognitoId -createdAt -updatedAt -relatives");
      }

      // User found
      if (mongodbResponse) {
        logger.info(
          "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );

        return mongodbResponse;
      }
      // User not found
      else {
        logger.info("USERS-DAO GET_USER_BY_AUTH_ID USER NOT FOUND" + "\n");
        return { error: "User not found" };
      }
    } catch (error) {
      logger.error(
        "USERS-DAO GET_USER_BY_AUTH_ID ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );
      return { error: error };
    }
  }

  static async get_one_by_email(email) {
    //try {
    logger.info("USERS-DAO GET_USER_BY_EMAIL STARTED: ");

    logger.info("Email: " + email + "\n");

    let mongodbResponse;

    // Find user by email
    mongodbResponse = await User.find({ email: email })
      .populate("company")
      .exec();

    // Return user without it being an array
    let newUser = mongodbResponse[0];

    //mongodbResponse = await users.findOne({ email: email }).populate({ path: 'company', _id: ObjectId  }).exec();

    // User found
    if (newUser) {
      logger.info(
        "USERS-DAO GET_USER_BY_EMAIL RESULT: " +
          JSON.stringify(mongodbResponse, null, 2) +
          "\n"
      );

      return newUser;
    }
    // User not found
    else {
      logger.info("USERS-DAO GET_USER_BY_EMAIL USER NOT FOUND" + "\n");
      return { error: "User not found" };
    }

    /**
       *   } catch (error) {
      logger.error(
        "USERS-DAO GET_USER_BY_EMAIL ERROR: " +
          JSON.stringify(error, null, 2) +
          "\n"
      );
      return { error: error };
    }
       */
  }
}
