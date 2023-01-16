import DAO from "./DAO.js";
import Order from "../models/app/orders/orders.model.js";

import {MONGODB_collection_orders} from "../../../config/constants/index.js";



export default class OrdersDAO extends DAO {

  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Order, MONGODB_collection_orders);
  }
}
