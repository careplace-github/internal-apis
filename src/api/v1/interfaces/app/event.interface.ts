// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICollaborator, IHealthUnit, IEventSeries, IHomeCareOrder } from '../';

interface IEvent {
  _id: Types.ObjectId | string;
  series?: Types.ObjectId | IEventSeries;

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

type IEventModel = IEvent & Document;

export { IEvent, IEventModel };
