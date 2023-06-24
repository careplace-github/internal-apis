// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICompany, IEvent, IMarketplaceUser, IRelative, IService } from '../';
// types
import { OrderRecurrency, OrderStatus, WeekDay, OrderScreeningVisitStatus } from '../../types';

export default interface IOrder extends Document {
  _id: Types.ObjectId | string;
  company: ICompany;
  caregiver?: Types.ObjectId | ICaregiver;
  user: Types.ObjectId | IMarketplaceUser;
  relative: Types.ObjectId | IRelative;
  services: Types.ObjectId[] | IService[];
  schedule_information: {
    start_date: Date;
    end_date?: Date;
    // recurrency should be an enum [0,1,2,4]
    recurrency: OrderRecurrency;
    schedule: {
      week_day: WeekDay;
      start: Date;
      end: Date;
    }[];
  };
  status: OrderStatus;
  decline_reason?: string;
  order_total: number;
  address: IAddress;
  screening_visit?: IEvent;
  screening_visit_status?: Types.ObjectId | OrderScreeningVisitStatus;
  observations?: string;
  stripe_subscription_id?: string;
}
