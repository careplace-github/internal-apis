// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ICustomer, ISettings } from 'src/packages/interfaces';
// types
import { TGender, TKinship } from 'src/packages/interfaces/types';

interface IPatient {
  _id: Types.ObjectId | string;
  customer?: Types.ObjectId | ICustomer;
  health_unit?: Types.ObjectId | IHealthUnit;

  kinship: TKinship;
  profile_picture?: string;
  name: string;
  birthdate: Date;
  phone?: string;
  gender: TGender;
  medical_conditions?: string;
  address: IAddress;
}

type IPatientDocument = IPatient & Document;

export { IPatient, IPatientDocument };
