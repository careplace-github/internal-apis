import {
  DB_name,
  COLLECTION_companies_ns,
} from "../../../config/constants/index.js";
import mongodb from "mongodb";
import User from "../models/auth/user.model.js";
// Import logger
import logger from "../../../logs/logger.js";

let companies;
const ObjectId = mongodb.ObjectId;

export default class companiesDAO {


  static async injectDB(conn) {
    if (companies) {
      return;
    }
    try {
      companies = await conn.db(DB_name).collection(COLLECTION_companies_ns);
    } catch (e) {
      logger.error(
        `Unable to establish a collection handle in companiesDAO: ${e}`
      );
    }
  }

  static async getCompanies() {
    try {
      const list = await companies.find().toArray();
      return list;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  static async createCompany(company) {
    try {
      const newCompany = await companies.insertOne(company);
      return newCompany;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  static async updateCompany(company) {
    try {
      const updatedCompany = await companies.updateOne(
        { _id: ObjectId(company.id) },
        { $set: company }
      );
      return updatedCompany;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  static async deleteCompany(companyId) {
    try {
      const deletedCompany = await companies.deleteOne({
        _id: ObjectId(companyId),
      });
      return deletedCompany;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  // Function to return a company by the user id
  static async getCompanyByUserId(id) {
    try {

   

      logger.info("Attempting to find company by userId: " + id + "\n");

      const company = await companies.findOne({ userId: `${id}` });

      return company;
    } catch (e) {
      logger.error(`Unable to find company by user id, ${e}`);
      return { error: e };
    }
  }

  static async getCompanyByEmail(email) {
    try {
      const company = await companies.findOne({ email: email });
      console.log("CompaniesDAO COmpnay: " + company);
      return company;
    } catch (e) {
      console.error(`Unable to find company by email, ${e}`);
      return { error: e };
    }
  }

  // Function to return a company by the company id
  static async getCompanyById(companyId) {
    try {
      const company = await companies.findOne({ _id: ObjectId(companyId) });
      return company;
    } catch (e) {
      console.error(`Unable to find company by id, ${e}`);
      return { error: e };
    }
  }
}
