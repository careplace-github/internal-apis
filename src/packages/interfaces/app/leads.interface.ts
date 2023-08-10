// mongoose
import { Types, Document } from 'mongoose';

interface ILead {
  _id: Types.ObjectId | string;
  type: 'caregiver' | 'health_unit' | 'collaborator_newsletter' | 'customer_newsletter';
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  company_type?: string;
  company_size?: string;
  role?: string;
  message?: string;
}
type ILeadDocument = ILead & Document;

export { ILead, ILeadDocument };
