import DAO from './DAO';
import { ReviewModel } from '../models';
import { IReview } from '../interfaces';

import { MONGODB_COLLECTION_REVIEWS_NS } from '../../../config/constants/index';

/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsDAO extends DAO<IReview> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(ReviewModel, MONGODB_COLLECTION_REVIEWS_NS);
  }
}
