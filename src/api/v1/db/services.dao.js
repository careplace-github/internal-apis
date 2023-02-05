import DAO from "./DAO.js";
import Service from "../models/admin/services.model.js";

import {MONGODB_COLLECTION_SERVICES_NS} from "../../../config/constants/index.js";



export default class servicesDAO extends DAO {

  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Service, MONGODB_COLLECTION_SERVICES_NS);
  }
}
