import { MONGODB_COLLECTION_SERVICES_NS } from '@constants';
import logger from 'src/logs/logger';
import DAO from './DAO';
import { ServiceModel } from '../models';
import { IServiceDocument } from '../interfaces';

/**
 * Class to manage the `Services` collection.
 */
export default class ServicesDAO extends DAO<IServiceDocument> {
  constructor() {
    super(ServiceModel, MONGODB_COLLECTION_SERVICES_NS);
  }
}
