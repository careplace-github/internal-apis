import DAO from './DAO';
import { HealthUnitReviewModel } from '../models';
import { IHealthUnitReviewModel } from '../interfaces';

import { MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `HealthUnit Reviews` collection.
 */
export default class HealthUnitReviewsDAO extends DAO<IHealthUnitReviewModel> {
  constructor() {
    super(HealthUnitReviewModel, MONGODB_COLLECTION_HEALTH_UNIT_REVIEWS_NS);
  }
}
