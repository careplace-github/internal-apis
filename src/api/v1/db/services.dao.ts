import DAO from './DAO';
import { ServiceModel } from '../models';
import { IService } from '../interfaces';
import { MONGODB_COLLECTION_SERVICES_NS } from '../../../config/constants/index';

export default class servicesDAO extends DAO<IService> {
  /**
   * @description Creates the db_connectionection to the MongoDB database.
   * @param {mongoose} db_connection
   * @returns {Promise<JSON>} - MongoDB response.
   */
  constructor() {
    super(ServiceModel, MONGODB_COLLECTION_SERVICES_NS);
  }
}
