import DAO from './DAO';
import { HomeCareOrderModel } from '../models';
import { IHomeCareOrderDocument } from '../interfaces';

import { MONGODB_COLLECTION_HOME_CARE_ORDERS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Home Care Orders` collection.
 */
export default class HomeCareOrdersDAO extends DAO<IHomeCareOrderDocument> {
  constructor() {
    super(HomeCareOrderModel, MONGODB_COLLECTION_HOME_CARE_ORDERS_NS);
  }
}
