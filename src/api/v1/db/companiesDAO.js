import {DB_name, COLLECTION_companies_ns } from "../../../config/constants/index.js"
import mongodb from "mongodb"
import User from "../models/auth/user.model.js"
let companies
const ObjectId = mongodb.ObjectId

export default class companiesDAO {

    static async injectDB(conn) {
       
        if (companies) {
            return
        }
        try {
            companies = await conn.db(DB_name).collection(COLLECTION_companies_ns)
        } catch (e) {
            console.error(`Unable to establish a collection handle in companiesDAO: ${e}`,)
        }
    } 

    


// Function to return a company by the user id
static async getCompanyByUserId(userId) {
    try {
        const company = await companies.findOne({"userId": ObjectId(userId)})
        return company
    } catch (e) {
        console.error(`Unable to find company by user id, ${e}`)
        return {error: e}
    }
   
}





   





}