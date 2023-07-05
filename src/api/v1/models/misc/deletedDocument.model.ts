// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IDeletedDocumentModel } from '../../interfaces';

const DeletedDocumentSchema: Schema<IDeletedDocumentModel> = new Schema<IDeletedDocumentModel>(
  {
    _id: Schema.Types.ObjectId,

    document_type: { type: String, required: true },

    document_collection: { type: String, required: true },

    document_deleted: { type: Schema.Types.Mixed, required: true },

    created_at: { type: Date, required: true, default: Date.now },

    updated_at: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const DeletedDocumentModel: Model<IDeletedDocumentModel> = mongoose.model<IDeletedDocumentModel>(
  'deletedDocument',
  DeletedDocumentSchema
);

export { DeletedDocumentSchema, DeletedDocumentModel };
