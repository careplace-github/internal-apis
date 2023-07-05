// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, ICompany, IEvent, ICustomer, IPatient, IService } from '..';
// types
import { OrderRecurrency, OrderStatus, WeekDay, OrderScreeningVisitStatus } from '../types';

interface IHomeCareOrder {
  _id: Types.ObjectId | string;
  company: ICompany;
  caregiver?: Types.ObjectId | ICaregiver;
  customer: Types.ObjectId | ICustomer;
  patient: Types.ObjectId | IPatient;
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
  screening_visit?: IEvent;
  screening_visit_status?: Types.ObjectId | OrderScreeningVisitStatus;
  observations?: string;
  stripe_information: {
    subscription_id?: string;
  };
  billing_details: {
    name: string;
    email: string;
    address: IAddress;
    tax_id?: string;
  };
}

type IHomeCareOrderModel = IHomeCareOrder & Document;

export { IHomeCareOrder, IHomeCareOrderModel };
