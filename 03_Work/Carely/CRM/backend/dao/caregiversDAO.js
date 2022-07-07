let caregivers
export default class CaregiversDAO {
    static async injectDB(conn) {
        if (caregivers) {
            return
        }
        try {
            caregivers = await conn.db(process.env.REST_CAREGIVERS_NS).collection("caregivers")
        } catch (e) {
            console.error(`Unable to establish a collection handle in caregiversDAO: ${e}`,)
        }
    }

static async getCaregivers ({
    filters = null,
    page = 0,
    caregiversPerPage = 10,
} = {}) {
    let query 
    if (filters) {
        //  Get Caregivers by Name 
        if ("name" in filters) {
            query = { $text: { $search: filters["name"] } }
        // Get Caregivers by Age    
        } else if ("age" in filters) {
            query = {"age": { $eq: filters["age"] } }
        // Get Caregivers by Rating        
        } else if ("rating" in filters) {
            query = {"rating": { $eq: filters["rating"] } }
        // Get Caregivers by Work Experience 
        } else if ("workExperience" in filters) {
            query = {"workExperience": { $eq: filters["workExperience"] } }
    }
}

let cursor

try {
    cursor = await caregivers
        .find(query)
}   catch (e) {
    console.error(`Unable to issue find command, ${e}`)
    return { caregiversList: [], totalNumCaregivers: 0}
}

const displayCursor = cursor.limit(caregiversPerPage).skip(caregiversPerPage * page)

try {
    const caregiversList = await displayCursor.toArray()
    const totalNumCaregivers = await caregivers.countDocuments(query)

    return { caregiversList, totalNumCaregivers }
}   catch (e) {
    console.error(`Unable to convert cursor to array or problem counting documents, ${e} `)

    return { caregiversList: [], totalNumCaregivers: 0}
}


}
}



