import {DB_name, COLLECTION_users_ns } from "../../../config/constants/index.js"
import mongodb from "mongodb"
import User from "../models/auth/user.model.js"
let users
const ObjectId = mongodb.ObjectId

export default class usersDAO {

    static async injectDB(conn) {
       
        if (users) {
            return
        }
        try {
            users = await conn.db(DB_name).collection(COLLECTION_users_ns)
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

    static async addUser(cognitoId , email, name, phoneNumber, country, city, address, zipCode, companyId, role, photoURL) {
      
        try {

            const newUser = new User ({
                cognitoId, 
                email, 
                name, 
                phoneNumber, 
                country, 
                city, 
                address, 
                zipCode, 
                companyId, 
                role,
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

static async getUsers () {
    try {
    const list = await users.find().toArray()
        return list
    } catch (e) {
        console.error(`Unable to find users, ${e}`)
        return {error: e}
    }
}


static async getUserByCognitoId(cognitoId){
    
        try {
            const user = await users.findOne({"cognitoId": cognitoId})
            console.log("User found: " + JSON.stringify(user, null, 2) + "\n")
            return user
        } catch (e) {
            console.error(`Unable to find users, ${e}`)
            return {error: e}
        }
    
    }


static async getUserRoleByCognitoId(cognitoId){ 
    try {
        const user = await users.findOne({"cognitoId": cognitoId})
        console.log("User found: " + JSON.stringify(user, null, 2) + "\n")

        const role = user.role
        console.log("User role: " + role)
        
        return role
    }
    catch (e) {
        console.error(`Unable to find users, ${e}`)
        return {error: e}
    }
}




}