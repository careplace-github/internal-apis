import {
  MONGODB_db_active,
  MONGODB_db_deletes,
  MONGODB_collection_companies,

} from "../../../config/constants/index.js";
import mongodb from "mongodb";
//import User from "../models/auth/user.model.js";
import companySchema from "../models/auth/company.model.js";
// Import logger
import logger from "../../../logs/logger.js";

let companies;
let Company;
const ObjectId = mongodb.ObjectId;

export default class companiesDAO {
  static async injectCollection(conn) {
    if (companies) {
      return;
    }
    try {
      Company = await conn.model("company", companySchema);
  

    //  companies = await conn.collection(MONGODB_collection_companies);
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

      // Create a new company

      const newCompany = await Company.create({
        _id: new ObjectId(),

        name: company.name,
        photoURL: company.photoURL,
        contactInformation: company.contactInformation,
        address: company.address,

        createdAt: new Date(),
        updatedAt: new Date(),
      });
      

      return await newCompany.save();

      

      // Add the company to the database

    const addCompany  = await companies.insertOne(newCompany);
      return addCompany;
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
  static async getCompanyByUserId(userId) {
    try {
      logger.info("Attempting to find company by userId: " + userId + "\n");

      const companies = await this.getCompanies();

      console.log("COMPANIES: " + JSON.stringify(companies[0].team, null, 2));

      for (let i = 0; i < companies.length; i++) {
        var team = companies[i].team;

        for (let j = 0; j < team.length; j++) {
          var user = team[j];

          if (user.equals(ObjectId(userId))) {
            
            logger.info("Found company by userId: " +  JSON.stringify(companies[i].team, null, 2) + "\n");

            return companies[i];
          }
        }
      }

      // Unable to find company by userId
      return { error: "User is not associated with a company" };

    } catch (error) {
      logger.error(
        "COMPANIES-DAO GET_COMPANY-BY-USERID ERROR: " + error + "\n"
      );
      return { error: error };
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
  static async get_one(companyId) {
    try {
      const company = await companies.findOne({ _id: ObjectId(companyId) });
      return company;
    } catch (e) {
      console.error(`Unable to find company by id, ${e}`);
      return { error: e };
    }
  }

static async add_user(companyId, userId) {
    try {
      const company = await companies.updateOne(
        { _id: ObjectId(companyId) },
        { $push: { team: ObjectId(userId) } }
      );
      return company;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }

}


}
