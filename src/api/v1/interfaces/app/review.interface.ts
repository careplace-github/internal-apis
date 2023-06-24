// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { ICompany, IMarketplaceUser, IOrder } from '..';

export default interface IReview extends Document {
  _id: Types.ObjectId | string;
  order: Types.ObjectId | IOrder;
  company: Types.ObjectId | ICompany;
  user: Types.ObjectId | IMarketplaceUser;
  rating: number;
  comment: string;
}
