// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IFile } from '../../interfaces';

const fileSchema: Schema<IFile> = new Schema<IFile>(
  {
    _id: Types.ObjectId,

    owner: { type: Schema.Types.ObjectId, ref: 'user', required: true },

    name: { type: String, required: true },

    url: { type: String, required: true, unique: true },
  },

  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const FileModel: Model<IFile> = mongoose.model<IFile>('File', fileSchema);

export default FileModel;

export { fileSchema };
