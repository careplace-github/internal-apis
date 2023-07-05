// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICollaborator, ICompany, IEventSeries, IHomeCareOrder } from '../';

interface IEvent {
  _id: Types.ObjectId | string;
  series?: Types.ObjectId | IEventSeries;

  ownerType: 'company' | 'collaborator';
  owner: Types.ObjectId | ICollaborator | ICompany;

  // If owner type is company
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
