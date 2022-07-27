import {DB_users_ns,DB_users_uri } from "../../../config/constants/index.js"
import mongodb from "mongodb"
import User from "../models/users.model.js"
let users
const ObjectId = mongodb.ObjectId

export default class usersDAO {

    static async injectDB(conn) {
       
        if (users) {
            return
        }
        try {
            users = await conn.db(DB_users_ns).collection("users")
        } catch (e) {
            console.error(`Unable to establish a collection handle in usersDAO: ${e}`,)
        }
    } 

    static async getUserByEmail (email) {
        try {
            const user = await users.findOne({email})
            return user
        } catch (e) {
            console.error(`Unable to find user by email, ${e}`)
            return {error: e}
        }
    }

    static async addUser(cognitoId, name, email) {
      
        try {

            const newUser = new User ({
                cognitoId,
                name,
                email,
            })


         await users.insertOne(newUser)

         return {
            statusCode: 200, 
            message: "Added user to the MongoDB database successfuly", 
            userCreated: newUser }

        } catch (e) {
            console.error(`Unable to POST user: ${e}`)
            
            return {statusCode: e.code, error: e.message}

        }

    }

static async getUsers (
) {
    try {
    const list = await users.find().toArray()
        return list
    } catch (e) {
        console.error(`Unable to find users, ${e}`)
        return {error: e}
    }
}
}



