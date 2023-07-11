import DAO from '../../common/db/DAO';
import { PatientModel } from '../models';
import { IPatientDocument } from '../interfaces';

import { MONGODB_COLLECTION_PATIENTS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Patients` collection.
 */
export default class PatientsDAO extends DAO<IPatientDocument> {
  constructor() {
    super(PatientModel, MONGODB_COLLECTION_PATIENTS_NS);
  }
}
