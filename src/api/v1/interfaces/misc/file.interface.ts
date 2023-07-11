// mongoose
import { Document, Types } from 'mongoose';

export default interface IFile {
  _id: Types.ObjectId;
  owner: Types.ObjectId | string;
  name: string;
  url: string;
}

type IFileDocument = IFile & Document;

export { IFile, IFileDocument };
