import CognitoService from "../services/cognito.service.js";
import companiesDAO from "../db/companies.dao.js";

import crmUsersDAO from "../db/crmUsers.dao.js";
import CRUD from "./crud.controller.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/server/request.utils.js";




export default class CompaniesController {



  static async getUsers(req, res, next) {
    const CrmUsersDAO = new crmUsersDAO();
    const CrmUsersCRUD = new CRUD(CrmUsersDAO);

    await CrmUsersCRUD.listByCompanyId(req, res, next);
  }




/**
 * @deprecated
 */





  static async index(req, res, next) {
    try {
      var request = requestUtils(req);
      const companies = await companiesDAO.getCompanies();
      res.status(200).json(companies);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      let request = requestUtils(req);
      const company = req.body;

      logger.info(
        "Company Controller CREATE: " + JSON.stringify(request, null, 2) + "\n"
      );

      // Check if company already exists by verifying the email
      const companyExists = await companiesDAO.get_one_by_email(
        company.contactInformation.email
      );
      if (companyExists) {
        request.statusCode = 400;
        request.response =
          "Company already exists with the email: " +
          company.contactInformation.email;

        logger.error(
          "Company Controller CREATE error: " +
            JSON.stringify(request, null, 2) +
            "\n"
        );

        return res.status(400).json({ error: "Company already exists" });
      }

      if (company.address) {
        let coordinates = [];
        let latitude;
        let longitude;

        // Get the latitude and longitude from the address
        // Use Google Maps API

        coordinates.push(latitude);
        coordinates.push(longitude);

        company.address.coordinates = coordinates;
      }

      const newCompany = await companiesDAO.add(company);
      res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
  }

  static async retrieve(req, res, next) {
    try {
      const companyId = req.params.id;

      // Check if company already exists by verifying the company id
      const company = await companiesDAO.get_one(companyId);
      if (!company) {
        return res.status(400).send("Company does not exist");
      }

      
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const company = req.body;
      const companyId = req.params.id;
      company.id = companyId;
      console.log(company);
      // Check if company already exists by verifying the company id
      const companyExists = await companiesDAO.getCompanyById(companyId);
      console.log(companyExists);
      if (!companyExists) {
        return res.status(400).send("Company does not exist");
      }

      const updatedCompany = await companiesDAO.updateCompany(company);
      res.status(200).json(updatedCompany);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const companyId = req.params.id;
      // Check if company already exists by verifying the company id
      const companyExists = await companiesDAO.getCompanyById(companyId);
      if (!companyExists) {
        return res.status(400).send("Company does not exist");
      }

      const deletedCompany = await companiesDAO.deleteCompany(companyId);
      res.status(200).json(deletedCompany);
    } catch (error) {
      next(error);
    }
  }
}
