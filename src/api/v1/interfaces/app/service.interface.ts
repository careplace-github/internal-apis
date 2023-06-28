// mongoose
import { Document, Types } from 'mongoose';

export default interface IService extends Document {
  _id: Types.ObjectId;
  type: string;
  name: string;
  short_description: string;
  description: string;
  image?: string;
  icon?: string;
}
