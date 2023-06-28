// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, ICompany, IService } from '../';
// types
import { Gender, Role } from '../../types';

export default interface ICaregiver extends Document {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: Gender;
  company: Types.ObjectId | ICompany;
  services: Types.ObjectId[] | IService[];
  address: IAddress;
  role: Exclude<Role, 'technical_direction' | 'social_worker' | 'hr'>;
  profile_picture?: string;
}
