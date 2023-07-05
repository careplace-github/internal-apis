// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ISettings } from '..';
// types
import { Gender, Permission, Role } from '../types';

interface ICollaborator {
  _id: Types.ObjectId | string;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: Gender;
  health_unit: Types.ObjectId | IHealthUnit;
  address: IAddress;
  role: Exclude<Role, 'caregiver'>;
  permissions: Permission[];
  settings: ISettings;
  profile_picture?: string;
}

type ICollaboratorModel = ICollaborator & Document;

export { ICollaborator, ICollaboratorModel };
