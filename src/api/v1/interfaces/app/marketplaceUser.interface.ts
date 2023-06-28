// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ISettings } from '../';
// types
import { Gender } from '../../types';

export default interface IMarketplaceUser extends Document {
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
