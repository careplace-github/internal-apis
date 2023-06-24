// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICRMUser, IEventSeries, IOrder } from '../';

export default interface IEvent extends Document {
  _id: Types.ObjectId | string;
  series?: Types.ObjectId | IEventSeries;

  type: 'company' | 'personal';

  // If type is personal
  user?: Types.ObjectId | ICRMUser;
  // If type is company
  order?: Types.ObjectId | IOrder;
  caregiver?: Types.ObjectId | ICaregiver;

  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: IAddress;
  textColor: string;
  allDay?: boolean;
}
