import CognitoService from "../services/cognito.service.js";
import companiesDAO from "../db/companiesDAO.js";

export default class UsersController {
  static async getCompanies(req, res, next) {
    try {
      const companies = await companiesDAO.getCompanies();
      res.status(200).json(companies);
    } catch (error) {
      next(error);
    }
  }

  static async createCompany(req, res, next) {
    try {
      const company = req.body;

      // Check if company already exists by verifying the email
      const companyExists = await companiesDAO.getCompanyByEmail(company.email);
      if (companyExists) {
        return res.status(400).send("Company already exists");
      }

      // The field userId is the id of the Company Owner
      // Verify if the userId is already associated with a company
      const userHasCompany = await companiesDAO.getCompanyByUserId(
        company.userId
      );
      if (userHasCompany) {
        return res.status(400).send("Company owner already has a company");
      }

      const newCompany = await companiesDAO.createCompany(company);
      res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
  }

  static async getCompany(req, res, next) {
    try {
      const companyId = req.params.id;

      // Check if company already exists by verifying the company id
      const companyExists = await companiesDAO.getCompanyById(companyId);
      if (!companyExists) {
        return res.status(400).send("Company does not exist");
      }

      const company = await companiesDAO.getCompanyById(companyId);
      res.status(200).json(company);
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req, res, next) {
    try {
      const company = req.body;
      const companyId = req.params.id;
      company.id = companyId;
      // Check if company already exists by verifying the company id
      const companyExists = await companiesDAO.getCompanyById(companyId);
      if (!companyExists) {
        return res.status(400).send("Company does not exist");
      }

      const updatedCompany = await companiesDAO.updateCompany(company);
      res.status(200).json(updatedCompany);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCompany(req, res, next) {
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
