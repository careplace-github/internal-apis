// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICustomer, ICompany, ICollaborator, IHomeCareOrder } from '..';
// types
import { OrderRecurrency } from '../types';

interface IEventSeries {
  _id: Types.ObjectId | string;

  ownerType: 'company' | 'collaborator';
  owner: Types.ObjectId | ICollaborator | ICompany;

  // If owner type is company
  order?: Types.ObjectId | IHomeCareOrder;

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
  description?: string;
  location?: IAddress;
  textColor: string;
  allDay?: boolean;
}

type IEventSeriesModel = IEventSeries & Document;

export { IEventSeries, IEventSeriesModel };
