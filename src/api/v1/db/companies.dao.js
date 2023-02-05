import DAO from "./DAO.js";
import Company from "../models/userLogic/companies.model.js";

import { MONGODB_COLLECTION_COMPANIES_NS } from "../../../config/constants/index.js";

/**
 * @class Class to manage the Companies collection.
 */
export default class CompaniesDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Company, MONGODB_COLLECTION_COMPANIES_NS);
  }
}
