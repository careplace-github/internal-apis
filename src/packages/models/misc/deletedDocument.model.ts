// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IDeletedDocumentDocument } from '../../interfaces';

const DeletedDocumentSchema: Schema<IDeletedDocumentDocument> = new Schema<IDeletedDocumentDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

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

const DeletedDocumentModel: Model<IDeletedDocumentDocument> = mongoose.model<IDeletedDocumentDocument>(
  'deletedDocument',
  DeletedDocumentSchema
);

export { DeletedDocumentSchema, DeletedDocumentModel };
