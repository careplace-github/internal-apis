// mongoose
import { Types, Document } from 'mongoose';

export default interface IDeletedDocument extends Document {
  _id: Types.ObjectId | string;
  document_type: string;
  document_collection: string;
  document_deleted: any;
  created_at: Date;
  updated_at: Date;
}
