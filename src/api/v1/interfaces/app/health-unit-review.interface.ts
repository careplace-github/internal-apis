// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IHealthUnit, ICustomer, IHomeCareOrder } from 'src/api/v1/interfaces';

interface IHealthUnitReview {
  _id: Types.ObjectId | string;
  health_unit: Types.ObjectId | IHealthUnit;
  customer: Types.ObjectId | ICustomer;
  rating: number;
  comment: string;
}

type IHealthUnitReviewDocument = IHealthUnitReview & Document;

export { IHealthUnitReview, IHealthUnitReviewDocument };
