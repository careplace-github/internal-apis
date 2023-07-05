// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ICustomer, ISettings } from '..';
// types
import { Gender, Kinship, Permission, Role, Theme } from '../types';

interface IPatient {
  _id: Types.ObjectId | string;
  customer: Types.ObjectId | ICustomer;
  health_unit?: Types.ObjectId | IHealthUnit;

  kinship: Kinship;
  profile_picture?: string;
  name: string;
  birthdate: Date;
  phone?: string;
  gender: Gender;
  medical_conditions?: string;
  address: IAddress;
}

type IPatientModel = IPatient & Document;

export { IPatient, IPatientModel };
