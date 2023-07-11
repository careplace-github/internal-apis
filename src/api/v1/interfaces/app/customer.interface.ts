// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ISettings } from 'src/api/v1/interfaces';
// types
import { TGender, TCustomerPermission } from 'src/api/v1/interfaces/types';

interface ICustomer {
  _id: Types.ObjectId | string;

  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate?: Date;
  gender?: TGender;
  address?: IAddress;
  stripe_information: {
    customer_id: string;
  };

  permissions: TCustomerPermission[];
  settings: ISettings;

  profile_picture?: string;
}

type ICustomerDocument = ICustomer & Document;

export { ICustomer, ICustomerDocument };
