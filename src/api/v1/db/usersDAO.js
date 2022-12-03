import {
  DB_name,
  COLLECTION_users_ns,
} from "../../../config/constants/index.js";
import mongodb from "mongodb";
import User from "../models/auth/user.model.js";

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
    } catch (e) {
      logger.error(
        `Unable to establish a collection handle in usersDAO: ${e}`
      );
    }
  }

  /**
   * @description Fetches the user information by the authentication provider id. If the user is associated with a company, the company information is also included.
   * @param {String} authId - Authentication provider id.
   * @param {String} authProvider - Authentication provider name.
   * @returns {Promise<JSON>} - User information.
   */
  static async getUserByAuthId(authId, authProvider) {
    let user;

    // Verifies if the email is not null
    if (authProvider) {
      try {
        switch (authProvider) {
          case "cognito":

           logger.info("Attempting to find user by cognitoId: " + authId + "\n");

            user = await users.findOne({ cognitoId: authId });

            return user;
          default:
            user = await users.findOne({ cognitoId: authId });
            return user;
        }
      } catch (e) {
        logger.error(`Unable to find user by email, ${e}`);
        return { error: e };
      }
    }
  }

  /**
   * @description Fetches the user information by the user id. If the user is associated with a company, the company information is also included.
   * @param {String} userId - User id from the database.
   * @returns {Promise<JSON>} - User information.
   */
  static async getUserById(userId) {
    if (userId) {
      try {
        const user = await users.findOne({ _id: ObjectId(userId) });

        if (user.role != "user") {
        }

        return user;
      } catch (e) {
        console.error(`Unable to find user by id, ${e}`);
        return { error: e };
      }
    }
  }

   /**
   * @description Inserts a new user in the database.
   * @param {User} user - User object.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async addUser(user) {
    try {
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
      });

      await users.insertOne(newUser);

      return {
        statusCode: 200,
        message: "Added user to the MongoDB database successfuly",
        userCreated: newUser,
      };
    } catch (e) {
      console.error(`Unable to POST user: ${e}`);

      return { statusCode: e.code, error: e.message };
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
      console.log("AQUI");
      console.log(user)
      const updatedUser = await users.updateOne(
        { _id: ObjectId(userId) },
        { $set: user }
      );
      console.log(updatedUser)
      return updatedUser;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  /**
   * @description Deletes the user from the database.
   * @param {*} userId - User id from the database.
   * @returns {Promise<JSON>} - MongoDB response.
   */  
  static async deleteUser(userId) {
    logger.info("Attempting to delete user with id: " + userId + "\n");
    try {
      const deletedUser = await users.deleteOne({ _id: ObjectId(userId) });
      logger.info("User deleted successfully. MongoDB response: " + deletedUser + "\n");
      return deletedUser;
    } catch (e) {
     logger.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  /**
   * @description Fetches all the users from the database.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  static async getUsers() {
    try {
      const list = await users.find().toArray();
      return list;
    } catch (e) {
      console.error(`Unable to find users, ${e}`);
      return { error: e };
    }
  }
}
