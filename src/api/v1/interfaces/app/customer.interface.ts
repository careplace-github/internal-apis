// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICompany, ISettings } from '..';
// types
import { Gender } from '../types';

interface ICustomer {
  _id: Types.ObjectId | string;
  company?: Types.ObjectId | ICompany;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate?: Date;
  gender?: Gender;
  address?: IAddress;
  stripe_information: {
    customer_id: string;
  };

  settings: ISettings;

  profile_picture?: string;
}

type ICustomerModel = ICustomer & Document;

export { ICustomer, ICustomerModel };
