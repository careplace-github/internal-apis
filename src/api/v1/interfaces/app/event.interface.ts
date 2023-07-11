// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import {
  IAddress,
  ICaregiver,
  ICollaborator,
  IHealthUnit,
  IEventSeries,
  IHomeCareOrder,
} from 'src/api/v1/interfaces';

interface IEvent {
  _id: Types.ObjectId | string;
  event_series?: Types.ObjectId | IEventSeries;

  ownerType: 'health_unit' | 'collaborator';
  owner: Types.ObjectId | ICollaborator | IHealthUnit;

  // If owner type is health-unit
  order?: Types.ObjectId | IHomeCareOrder;

  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: IAddress;
  textColor: string;
  allDay?: boolean;
}

type IEventDocument = IEvent & Document;

export { IEvent, IEventDocument };
