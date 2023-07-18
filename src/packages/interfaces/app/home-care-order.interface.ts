// mongoose
import { Document, Types } from 'mongoose';
// interfaces
import { IAddress, ICaregiver, IHealthUnit, IEvent, ICustomer, IPatient, IService } from 'src/packages/interfaces';
// types
import { THomeCareOrderRecurrency, THomeCareOrderStatus, TWeekDay, THomeCareOrderScreeningVisitStatus } from 'src/packages/interfaces/types';

interface IHomeCareOrder {
  _id: Types.ObjectId | string;
  health_unit: IHealthUnit;
  caregiver?: Types.ObjectId | ICaregiver;
  customer: Types.ObjectId | ICustomer;
  patient: Types.ObjectId | IPatient;
  services: Types.ObjectId[] | IService[];
  schedule_information: {
    start_date: Date;
    end_date?: Date;
    // recurrency should be an enum [0,1,2,4]
    recurrency: THomeCareOrderRecurrency;
    schedule: {
      week_day: TWeekDay;
      start: Date;
      end: Date;
    }[];
  };
  status: THomeCareOrderStatus;
  decline_reason?: string;
  order_total: number;
  screening_visit?: IEvent;
  screening_visit_status?: THomeCareOrderScreeningVisitStatus;
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

type IHomeCareOrderDocument = IHomeCareOrder & Document;

export { IHomeCareOrder, IHomeCareOrderDocument };
