import DAO from './DAO';
import { PatientModel } from '../models';
import { IPatientModel } from '../interfaces';

import { MONGODB_COLLECTION_PATIENTS_NS } from '../../../config/constants/index';

/**
 * Class to manage the `Patients` collection.
 */
export default class PatientsDAO extends DAO<IPatientModel> {
  constructor() {
    super(PatientModel, MONGODB_COLLECTION_PATIENTS_NS);
  }
}
