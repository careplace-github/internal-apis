// mongoose
import { Document, Types } from 'mongoose';

export default interface IFile {
  _id: Types.ObjectId;
  owner: Types.ObjectId | string;
  name: string;
  url: string;
}

type IFileModel = IFile & Document;

export { IFile, IFileModel };
