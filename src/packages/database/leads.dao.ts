import DAO from './DAO';
import { LeadModel } from '../models';
import { ILeadDocument } from '../interfaces';

/**
 * Class to manage the `Caregivers` collection.
 */
export default class CaregiversDAO extends DAO<ILeadDocument> {
  constructor() {
    super(LeadModel, 'Lead');
  }
}
