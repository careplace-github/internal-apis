// mongoose
import { Document, Types } from 'mongoose';

// types
import { THomeCareOrderRecurrency } from 'src/packages/interfaces/types';

// interfaces
import { IAddress, ICustomer, IHealthUnit, ICollaborator, IHomeCareOrder } from '..';


interface IEventSeries {
  _id: Types.ObjectId | string;

  ownerType: 'health_unit' | 'collaborator';
  owner: Types.ObjectId | ICollaborator | IHealthUnit;

  // If owner type is health-unit
  order?: Types.ObjectId | IHomeCareOrder;

  start_date: Date;
  recurrency: THomeCareOrderRecurrency;
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

type IEventSeriesDocument = IEventSeries & Document;

export { IEventSeries, IEventSeriesDocument };
