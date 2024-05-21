import DAO from './DAO';
import { AdModel } from '../models';
import { IAdDocument } from '../interfaces';

import { MONGODB_COLLECTION_ADS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Adss` collection.
 */
export default class AdssDAO extends DAO<IAdDocument> {
  constructor() {
    super(AdModel, MONGODB_COLLECTION_ADS_NS);
  }
}
