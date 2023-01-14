import {
  MONGODB_db_active,
  MONGODB_db_deletes,
  MONGODB_collection_companies,
} from "../../../config/constants/index.js";
import mongodb from "mongodb";
//import User from "../models/auth/user.model.js";
import companySchema from "../models/userLogic/companies.model.js";
// Import logger
import logger from "../../../logs/logger.js";

let companies;
let Company;
const ObjectId = mongodb.ObjectId;

export default class companiesDAO {
  static async injectCollection(db_connection , deletes_db_connection) {
    if (companies) {
      return;
    }
    try {
      Company = await db_connection .model("company", companySchema);
      Company.injectCollection(deletes_db_connection);

      //  companies = await db_connection .collection(MONGODB_collection_companies);
    } catch (e) {
      logger.error(
        `Unable to establish a collection handle in companiesDAO: ${e}`
      );
    }
  }

  static async get_list() {
    try {
      const list = await companies.find().toArray();
      return list;
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  static async add(company) {
    try {
      // Loop through the services and create a new array of services with the object id of the service
      let services = [];
      for (let i = 0; i < company.services.length; i++) {
        services.push(ObjectId(company.services[i]));
      }

      // Create a new company

      const newCompany = await Company.create({
        _id: new ObjectId(),

        name: company.name,
        // Object Id of the schema File
        logo: ObjectId(company.logo),

        contactInformation: {
          email: company.contactInformation.email,
          phoneNumber: company.contactInformation.phone,
          website: company.contactInformation.website,
        },

        services: services,

        address: {
          street: company.address.street,
          postalCode: company.address.postalCode,
          state: company.address.state,
          city: company.address.city,
          country: company.address.country,
          countryId: company.address.countryId,
          fullAddress:
            company.address.fullAddress ||
            company.address.street +
              " " +
              company.address.postalCode +
              " " +
              company.address.city +
              " " +
              company.address.state +
              " " +
              company.address.country +
              " ",

          coordinates: company.address.coordinates,
        },

        legalInformation: {
          businessName: company.legalInformation.businessName,
          taxId: company.legalInformation.taxId,
          businessStructure: company.legalInformation.businessStructure,
        },

        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await newCompany.save();
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }

  // Function to return a company by the company id
  static async get_one(companyId) {
    try {
      const company = await Company.findById(companyId)
        .populate("services")
        .populate("team","-settings")
        .exec();
      return company;
    } catch (e) {
      console.error(`Unable to find company by id, ${e}`);
      return { error: e };
    }
  }

  static async set(company) {
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

  static async delete(companyId) {
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
  static async get_one_by_owner_id(userId) {
    try {
      logger.info("Attempting to find company by userId: " + userId + "\n");

      const companies = await this.getCompanies();

      console.log("COMPANIES: " + JSON.stringify(companies[0].team, null, 2));

      for (let i = 0; i < companies.length; i++) {
        var team = companies[i].team;

        for (let j = 0; j < team.length; j++) {
          var user = team[j];

          if (user.equals(ObjectId(userId))) {
            logger.info(
              "Found company by userId: " +
                JSON.stringify(companies[i].team, null, 2) +
                "\n"
            );

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

  static async get_one_by_email(email) {
    try {
      logger.info("COMPANY_DAO GET_COMPANY_BY_EMAIL: " + email + "\n");
      const company = await Company.findOne({
        contactInformation: { email: email },
      });
      logger.info("COMPANY_DAO GET_COMPANY_BY_EMAIL RESULT: " + company);
      return company;
    } catch (e) {
      logger.error(`Unable to find company by email, ${e}`);
      return { error: e };
    }
  }

  static async add_user(companyId, userId) {
    try {


      let updatedCompany = await Character.findOneAndUpdate(filter, team.push(userId), {
        new: true
      });


       Company = await Company.updateOne(
        { _id: ObjectId(companyId) },
        { $push: { team: ObjectId(userId) } }
      );
      return updatedCompany;
      a
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`);
      return { error: e };
    }
  }
}
