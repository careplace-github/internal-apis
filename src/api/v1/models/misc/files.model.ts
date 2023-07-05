// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IFileModel } from '../../interfaces';

const FileSchema: Schema<IFileModel> = new Schema<IFileModel>(
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

const FileModel: Model<IFileModel> = mongoose.model<IFileModel>('File', FileSchema);

export { FileSchema, FileModel };
