import {
  DB_name,
  COLLECTION_users_ns,
} from "../../../config/constants/index.js";
import mongodb from "mongodb";
import User from "../models/auth/user.model.js";

let users;
const ObjectId = mongodb.ObjectId;

export default class usersDAO {
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      users = await conn.db(DB_name).collection(COLLECTION_users_ns);
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in usersDAO: ${e}`
      );
    }
  }

  static async getUserByAuthId(authId, authProvider) {
    let user;

    // Verifies if the email is not null
    if (authProvider) {
      try {
        switch (authProvider) {
          case "cognito":
            user = await users.findOne({ cognitoId: authId });

            return user;
          default:
            user = await users.findOne({ cognitoId: authId });
            return user;
        }
      } catch (e) {
        console.error(`Unable to find user by email, ${e}`);
        return { error: e };
      }
    }
  }

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
        role: user.role,
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
