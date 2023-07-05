import DAO from './DAO';
import { CompanyReviewModel } from '../models';
import { ICompanyReviewModel } from '../interfaces';

import { MONGODB_COLLECTION_REVIEWS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Company Reviews` collection.
 */
export default class CompanyReviewsDAO extends DAO<ICompanyReviewModel> {
  constructor() {
    super(CompanyReviewModel, MONGODB_COLLECTION_REVIEWS_NS);
  }
}
