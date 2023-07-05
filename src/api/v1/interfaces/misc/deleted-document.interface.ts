// mongoose
import { Types, Document } from 'mongoose';

interface IDeletedDocument {
  _id: Types.ObjectId | string;
  document_type: string;
  document_collection: string;
  document_deleted: any;
  created_at: Date;
  updated_at: Date;
}

type IDeletedDocumentModel = IDeletedDocument & Document;

export { IDeletedDocument, IDeletedDocumentModel };
