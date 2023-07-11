import DAO from '../../common/db/DAO';
import { FileModel } from '../models';
import { IFileDocument } from '../interfaces';

import { MONGODB_COLLECTION_FILES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Files` collection.
 */
export default class FilesDAO extends DAO<IFileDocument> {
  constructor() {
    super(FileModel, MONGODB_COLLECTION_FILES_NS);
  }
}
