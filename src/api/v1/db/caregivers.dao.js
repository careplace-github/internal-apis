import DAO from "./DAO";
import Caregiver from "../models/userLogic/caregivers.model";

import {MONGODB_COLLECTION_CAREGIVERS_NS} from "../../../config/constants/index";





/**
 * @class Class to manage the EVENTS collection.
 */
export default class EventsDAO extends DAO {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(Caregiver, MONGODB_COLLECTION_CAREGIVERS_NS);

   

  }
}
