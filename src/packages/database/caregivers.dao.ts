import DAO from './DAO';
import { CaregiverModel } from '../models';
import { ICaregiverDocument } from '../interfaces';

import { MONGODB_COLLECTION_CAREGIVERS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Caregivers` collection.
 */
export default class CaregiversDAO extends DAO<ICaregiverDocument> {
  constructor() {
    super(CaregiverModel, MONGODB_COLLECTION_CAREGIVERS_NS);
  }
}
