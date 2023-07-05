export type Kinship =
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'greatGrandfather'
  | 'greatGrandmother'
  | 'uncle'
  | 'aunt'
  | 'son'
  | 'daughter'
  | 'brother'
  | 'sister'
  | 'other';

import { PatientModel } from '../../models';
export type PatientModelType = typeof PatientModel;
