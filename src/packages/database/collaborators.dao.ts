import DAO from './DAO';
import { CollaboratorModel } from '../models';
import { ICollaboratorDocument } from '../interfaces';

import { MONGODB_COLLECTION_COLLABORATORS_NS } from '../../config/constants/index';

/**
 * Class to manage the `Collaborators` collection.
 */
export default class CollaboratorsDAO extends DAO<ICollaboratorDocument> {
  constructor() {
    super(CollaboratorModel, MONGODB_COLLECTION_COLLABORATORS_NS);
  }
}
