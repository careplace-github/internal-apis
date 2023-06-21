import DAO from "./DAO";
import Order from "../models/app/orders/orders.model";

import {MONGODB_COLLECTION_ORDERS_NS} from "../../../config/constants/index";



export default class OrdersDAO extends DAO {

  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Order, MONGODB_COLLECTION_ORDERS_NS);
  }
}
