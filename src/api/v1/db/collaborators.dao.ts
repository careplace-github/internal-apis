import DAO from './DAO';
import { CollaboratorModel } from '../models';
import { ICollaboratorModel } from '../interfaces';

import { MONGODB_COLLECTION_CRM_USERS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Collaborators` collection.
 */
export default class CollaboratorsDAO extends DAO<ICollaboratorModel> {
  constructor() {
    super(CollaboratorModel, MONGODB_COLLECTION_CRM_USERS_NS);
  }
}
