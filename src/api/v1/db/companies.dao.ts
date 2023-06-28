import DAO from './DAO';
import { CompanyModel } from '../models';
import { ICompany } from '../interfaces';

import { MONGODB_COLLECTION_COMPANIES_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the Companies collection.
 */
export default class CompaniesDAO extends DAO<ICompany> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(CompanyModel, MONGODB_COLLECTION_COMPANIES_NS);
  }
}
