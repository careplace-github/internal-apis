import {
  DB_name,
  COLLECTION_users_ns,
} from "../../../config/constants/index.js";
import mongodb from "mongodb";
import User from "../models/auth/user.model.js";

import companiesDAO from "./companiesDAO.js";

// Import logger
import logger from "../../../logs/logger.js";

let users;
const ObjectId = mongodb.ObjectId;

/**
 * @class Class to manage the users collection.
 */
export default class usersDAO {
  /**
   * @description Creates the connection to the MongoDB database.
   * @param {*} conn
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      users = await conn.db(DB_name).collection(COLLECTION_users_ns);
    } catch (error) {
      logger.error(
        `Unable to establish a collection handle in usersDAO: ${error}`
      );
      return { error: error };
    }
  }

  /**
   * @description Fetches the user information by the authentication provider id. If the user is associated with a company, the company information is also included.
   * @param {String} authId - Authentication provider id.
   * @param {String} authProvider - Authentication provider name.
   * @returns {Promise<JSON>} - User information.
   */
  static async getUserByAuthId(authId, authProvider) {
    let mongodbResponse;
    try {
      logger.info("USERS-DAO GET_USER_BY_AUTH_ID STARTED: ");

      logger.info("USERS-DAO GET_USER_BY_AUTH_ID authId: " + authId);
      logger.info(
        "USERS-DAO GET_USER_BY_AUTH_ID authProvider: " + authProvider + "\n"
      );

      // Verifies if it was provided the authId and authProvider
      if (authProvider && authId) {
        switch (authProvider) {
          case "cognito":
            mongodbResponse = await users.findOne({ cognitoId: authId });

            // User found
            if (mongodbResponse) {
              logger.info(
                "USERS-DAO GET_USER_BY_AUTH_ID RESULT: " +
                  JSON.stringify(mongodbResponse, null, 2) +
                  "\n"
              );

              return mongodbResponse;
              // User not found
            } else {
              logger.info(
                "USERS-DAO GET_USER_BY_AUTH_ID USER NOT FOUND" + "\n"
              );
              return { error: "User not found" };
            }
        }
      } else {
        logger.info(
          "USERS-DAO GET_USER_BY_AUTH_ID ERROR: Missing authProvider and/or authId." +
            "\n"
        );
        return { error: "Missing authProvider and/or authId." };
      }
    } catch (error) {
      logger.error("USERS-DAO GET_USER_BY_AUTH_ID ERROR: " + error + "\n");
      return { error: error };
    }
  }

  /**
   * @description Fetches the user information by the user id. If the user is associated with a company, the company information is also included.
   * @param {String} userId - User id from the database.
   * @returns {Promise<JSON>} - User information.
   */
  static async getUserById(userId) {
    try {
      logger.info("USERS-DAO GET_USER_BY_ID STARTED: ");

      logger.info("USERS-DAO GET_USER_BY_ID userId: " + userId + "\n");

      const mongodbResponse = await users.findOne({ _id: ObjectId(userId) });

      // User found
      if (mongodbResponse) {
        // The role "user" is the only role that is not associated with a company

        logger.info(
          "USERS-DAO GET_USER_BY_ID RESULT: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );

        return mongodbResponse;

        // User not found
      } else {
        logger.info("USERS-DAO GET_USER_BY_ID USER NOT FOUND" + "\n");
        return { error: "User not found" };
      }
    } catch (error) {
      logger.error("USERS-DAO GET_USER_BY_ID ERROR: " + error + "\n");
      return { error: error };
    }
  }

  /**
   * @description Inserts a new user in the database.
   * @param {User} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async addUser(user) {
    try {
      logger.info("USERS-DAO ADD_USER STARTED: ");

      logger.info(
        "USERS-DAO ADD_USER user: " + JSON.stringify(user, null, 2) + "\n"
      );

      const newUser = new User({
        cognitoId: user.cognitoId,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        country: user.country,
        city: user.city,
        address: user.address,
        zipCode: user.zipCode,
        companyId: user.companyId,
        role: user.role || "user", // Default role is user
        companyId: user.companyId,
      });

      const mongodbResponse = await users.insertOne(newUser);

      // User inserted
      if (mongodbResponse.insertedCount === 1) {
        logger.info(
          "USERS-DAO ADD_USER RESULT: " +
            JSON.stringify(mongodbResponse.ops[0], null, 2) +
            "\n"
        );
        return {
          response: mongodbResponse,
          userCreated: newUser,
        };
      }
      // User not inserted
      else {
        logger.info("USERS-DAO ADD_USER ERROR: " + mongodbResponse + "\n");
        return { error: mongodbResponse };
      }
    } catch (error) {
      logger.error(
        "USERS-DAO ADD_USER ERROR: " + JSON.stringify(error, null, 2) + "\n"
      );

      return { error: error };
    }
  }

  /**
   * @description Updates the user information in the database.
   * @param {*} userId - User id from the database.
   * @param {*} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async updateUser(userId, user) {
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
  static async deleteUser(userId) {
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

  /**
   * @description Fetches all the users from the database.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async getUsers() {
    try {
      logger.info("USERS-DAO GET_USERS STARTED: ");

      let mongodbResponse = {};
      mongodbResponse = await users.find().toArray();

      // Users found
      if (mongodbResponse.length > 0) {
        logger.info(
          "USERS-DAO GET_USERS RESULT: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return mongodbResponse;
      }
      // Users not found
      else {
        logger.info(
          "USERS-DAO GET_USERS ERROR: " +
            JSON.stringify(mongodbResponse, null, 2) +
            "\n"
        );
        return { error: mongodbResponse };
      }
    } catch (e) {
      logger.error(
        "MONGODB GET_USERS ERROR:" + JSON.stringify(error, null, 2) + "\n"
      );

      return { error: error };
    }
  }
}
