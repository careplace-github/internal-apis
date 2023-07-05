// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { ICompany, ICustomer, IHomeCareOrder } from '..';

interface ICompanyReview {
  _id: Types.ObjectId | string;
  company: Types.ObjectId | ICompany;
  customer: Types.ObjectId | ICustomer;
  rating: number;
  comment: string;
}

type ICompanyReviewModel = ICompanyReview & Document;

export { ICompanyReview, ICompanyReviewModel };
