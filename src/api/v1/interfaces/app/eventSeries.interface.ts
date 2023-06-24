// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICompany, ICRMUser, IOrder } from '../';
// types
import { OrderRecurrency } from '../../types';

export default interface IEventSeries extends Document {
  _id: Types.ObjectId | string;

  type: 'company' | 'personal';

  // If type is personal
  user?: Types.ObjectId | ICRMUser;
  // If type is company
  company?: Types.ObjectId | ICompany;
  order?: Types.ObjectId | IOrder;
  caregiver?: Types.ObjectId | ICaregiver;

  start_date: Date;
  recurrency: OrderRecurrency;
  schedule: {
    start: Date;
    end: Date;
  }[];
  end_series: {
    // 0 = never, 1 = on date, 2 = after occurrences
    ending_type: 0 | 1;
    end_date?: Date;
    end_occurrences?: number;
  };
  title: string;
  description: string;
  location?: IAddress;
  textColor: string;
  allDay: boolean;
}
