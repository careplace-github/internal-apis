// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IDeletedDocument } from '../../interfaces';

const deletedDocumentSchema: Schema<IDeletedDocument> = new Schema<IDeletedDocument>(
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

const DeletedDocumentModel: Model<IDeletedDocument> = mongoose.model<IDeletedDocument>(
  'deletedDocument',
  deletedDocumentSchema
);

export default DeletedDocumentModel;

export { deletedDocumentSchema };
