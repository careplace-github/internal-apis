import mongoose from "mongoose";

const Schema = mongoose.Schema;

const deletedDocumentSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    document_type: { type: String, required: true },

    document_collection: { type: String, required: true },

    document_deleted: { type: JSON, required: true },

    created_at: { type: Date, required: true, default: Date.now() },

    updated_at: { type: Date, required: true, default: Date.now() },

  },
  {
    timestamps: false,
  }
);


export  default deletedDocumentSchema;


//export default Event = mongoose.model("DeletedDocument", deletedDocumentSchema);

