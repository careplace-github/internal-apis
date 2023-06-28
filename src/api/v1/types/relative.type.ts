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

import { RelativeModel } from '../models';
export type RelativeModelType = typeof RelativeModel;
