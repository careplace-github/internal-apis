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

    static async addUser(cognitoId, name, email) {
      
        try {


            console.log("cog" + cognitoId)

            const newUser = new User ({
                cognitoId,
                name,
                email,
            })

            console.log("cog" + newUser.cognitoId)
         

            return await users.insertOne(newUser)

        } catch (e) {
            console.error(`Unable to POST user: ${e}`)
            return {error: e}

        }

    }

static async getusers ({
    filters = null,
    page = 0,
    usersPerPage = 10,
} = {}) {
    let query 
    if (filters) {
        //  Get users by Name 
        if ("name" in filters) {
            query = { $text: { $search: filters["name"] } }
        // Get users by Age    
        } else if ("age" in filters) {
            query = {"age": { $eq: filters["age"] } }
        // Get users by Rating        
        } else if ("rating" in filters) {
            query = {"rating": { $eq: filters["rating"] } }
        // Get users by Work Experience 
        } else if ("workExperience" in filters) {
            query = {"workExperience": { $eq: filters["workExperience"] } }
    }
}

let cursor

try {
    cursor = await users
        .find(query)
}   catch (e) {
    console.error(`Unable to issue find command, ${e}`)
    return { usersList: [], totalNumusers: 0}
}

const displayCursor = cursor.limit(usersPerPage).skip(usersPerPage * page)

try {
    const usersList = await displayCursor.toArray()
    const totalNumusers = await users.countDocuments(query)

    return { usersList, totalNumusers }
}   catch (e) {
    console.error(`Unable to convert cursor to array or problem counting documents, ${e} `)

    return { usersList: [], totalNumusers: 0}
}


}
}



