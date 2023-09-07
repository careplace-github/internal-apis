// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ISettings } from 'src/packages/interfaces';
// types
import { TGender, TCustomerPermission } from 'src/packages/interfaces/types';

interface ICustomer {
  _id: Types.ObjectId | string;

  cognito_id: string;
  health_unit?: Types.ObjectId | IHealthUnit;
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
