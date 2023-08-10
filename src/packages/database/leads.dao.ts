import DAO from './DAO';
import { LeadModel } from '../models';
import { ILeadDocument } from '../interfaces';

/**
 * Class to manage the `Leads` collection.
 */
export default class LeadsDAO extends DAO<ILeadDocument> {
  constructor() {
    super(LeadModel, 'Lead');
  }
}
