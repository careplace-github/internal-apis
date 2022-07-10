let users
export default class usersDAO {

    static async injectDB(conn) {
        if (users) {
            return
        }
        try {
            users = await conn.db(process.env.DB_CRM_CLUSTER_URI).collection("crm_users")
        } catch (e) {
            console.error(`Unable to establish a collection handle in usersDAO: ${e}`,)
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



