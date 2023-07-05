// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IHealthUnit, ICustomer, IHomeCareOrder } from '..';

interface IHealthUnitReview {
  _id: Types.ObjectId | string;
  health_unit: Types.ObjectId | IHealthUnit;
  customer: Types.ObjectId | ICustomer;
  rating: number;
  comment: string;
}

type IHealthUnitReviewModel = IHealthUnitReview & Document;

export { IHealthUnitReview, IHealthUnitReviewModel };
