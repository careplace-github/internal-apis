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

    



static async getCompanies () {
    try {
    const list = await companies.find().toArray()
        return list
    } catch (e) {
        console.error(`Unable to find companies, ${e}`)
        return {error: e}
    }
}





   





}