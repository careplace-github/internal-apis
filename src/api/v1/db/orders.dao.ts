import DAO from './DAO';
import { OrderModel } from '../models';
import { IOrder } from '../interfaces';

import { MONGODB_COLLECTION_ORDERS_NS } from '../../../config/constants/index';

export default class OrdersDAO extends DAO<IOrder> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(OrderModel, MONGODB_COLLECTION_ORDERS_NS);
  }
}
