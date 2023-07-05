import DAO from './DAO';
import { HomeCareOrderModel } from '../models';
import { IHomeCareOrderModel } from '../interfaces';

import { MONGODB_COLLECTION_ORDERS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Home Care Orders` collection.
 */
export default class HomeCareOrdersDAO extends DAO<IHomeCareOrderModel> {
  constructor() {
    super(HomeCareOrderModel, MONGODB_COLLECTION_ORDERS_NS);
  }
}
