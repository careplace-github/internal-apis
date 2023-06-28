// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICompany, IMarketplaceUser, ISettings } from '..';
// types
import { Gender, Kinship, Permission, Role, Theme } from '../../types';

export default interface IRelative extends Document {
  _id: Types.ObjectId | string;
  user: Types.ObjectId | IMarketplaceUser;
  kinship: Kinship;
  profile_picture?: string;
  name: string;
  birthdate: Date;
  phone?: string;
  gender: Gender;
  medical_conditions?: string;
  address?: IAddress;
}
