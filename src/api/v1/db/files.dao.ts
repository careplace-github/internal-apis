import DAO from './DAO';
import { FileModel } from '../models';
import { IFileModel } from '../interfaces';

import { MONGODB_COLLECTION_FILES_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Files` collection.
 */
export default class FilesDAO extends DAO<IFileModel> {
  constructor() {
    super(FileModel, MONGODB_COLLECTION_FILES_NS);
  }
}
