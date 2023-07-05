// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ISettings } from '..';
// types
import { Gender } from '../types';

interface ICustomer {
  _id: Types.ObjectId | string;

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
