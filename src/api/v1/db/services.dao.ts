import DAO from './DAO';
import { ServiceModel } from '../models';
import { IServiceModel } from '../interfaces';
import { MONGODB_COLLECTION_SERVICES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Services` collection.
 */
export default class ServicesDAO extends DAO<IServiceModel> {
  constructor() {
    super(ServiceModel, MONGODB_COLLECTION_SERVICES_NS);
  }
}
