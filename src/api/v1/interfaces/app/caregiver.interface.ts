// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, IService } from '../';
// types
import { Gender, Permission, Role } from '../types';

interface ICaregiver {
  _id: Types.ObjectId | string;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: Gender;
  health_unit: Types.ObjectId | IHealthUnit;
  services: Types.ObjectId[] | IService[];
  address: IAddress;
  role: Exclude<Role, 'technical_direction' | 'social_worker' | 'hr'>;
  permissions: Permission[];
  profile_picture?: string;
}

type ICaregiverModel = ICaregiver & Document;

export { ICaregiver, ICaregiverModel };
