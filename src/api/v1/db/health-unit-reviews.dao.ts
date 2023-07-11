import DAO from '../../common/db/DAO';
import { HealthUnitReviewModel } from '../models';
import { IHealthUnitReviewDocument } from '../interfaces';

import { MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `HealthUnit Reviews` collection.
 */
export default class HealthUnitReviewsDAO extends DAO<IHealthUnitReviewDocument> {
  constructor() {
    super(HealthUnitReviewModel, MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS);
  }
}
