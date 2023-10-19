import DAO from './DAO';
import { OrderModel } from '../models';
import { IOrderDocument } from '../interfaces';

import { MONGODB_COLLECTION_HOME_CARE_ORDERS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Home Care Orders` collection.
 */
export default class HomeCareOrdersDAO extends DAO<IOrderDocument> {
  constructor() {
    super(OrderModel, MONGODB_COLLECTION_HOME_CARE_ORDERS_NS);
  }
}
