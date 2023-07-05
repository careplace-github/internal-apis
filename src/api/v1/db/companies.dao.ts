import DAO from './DAO';
import { CompanyModel } from '../models';
import { ICompanyModel } from '../interfaces';

import { MONGODB_COLLECTION_COMPANIES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Companies` collection.
 */
export default class CompaniesDAO extends DAO<ICompanyModel> {
  constructor() {
    super(CompanyModel, MONGODB_COLLECTION_COMPANIES_NS);
  }
}
