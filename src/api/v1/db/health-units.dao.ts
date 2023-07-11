import DAO from '../../common/db/DAO';
import { HealthUnitModel } from '../models';
import { IHealthUnitDocument } from '../interfaces';

import { MONGODB_COLLECTION_HEALTH_UNITS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `HealthUnits` collection.
 */
export default class HealthUnitsDAO extends DAO<IHealthUnitDocument> {
  constructor() {
    super(HealthUnitModel, MONGODB_COLLECTION_HEALTH_UNITS_NS);
  }
}
