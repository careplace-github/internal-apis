// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, ICompany, ISettings } from '../';
// types
import { Gender, Permission, Role } from '../../types';

export default interface ICRMUser extends Document {
  _id: Types.ObjectId | string;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: Gender;
  company: Types.ObjectId | ICompany;
  address: IAddress;
  role: Exclude<Role, 'caregiver'>;
  permissions: Permission[];
  settings: ISettings;
  profile_picture?: string;
}
