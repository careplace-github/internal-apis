// mongoose
import { Document, Types } from 'mongoose';

export default interface IFile extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId | string;
  name: string;
  url: string;
}
