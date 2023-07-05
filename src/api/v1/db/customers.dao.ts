import DAO from './DAO';
import { CustomerModel } from '../models';
import { ICustomerModel } from '../interfaces';

import { MONGODB_COLLECTION_CUSTOMERS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Customers` collection.
 */
export default class CustomersDAO extends DAO<ICustomerModel> {
  constructor() {
    super(CustomerModel, MONGODB_COLLECTION_CUSTOMERS_NS);
  }
}
