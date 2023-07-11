import DAO from '../../common/db/DAO';
import { ServiceModel } from '../models';
import { IServiceDocument } from '../interfaces';
import { MONGODB_COLLECTION_SERVICES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Services` collection.
 */
export default class ServicesDAO extends DAO<IServiceDocument> {
  constructor() {
    super(ServiceModel, MONGODB_COLLECTION_SERVICES_NS);
  }
}
