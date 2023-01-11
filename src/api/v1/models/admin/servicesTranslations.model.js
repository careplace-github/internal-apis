import mongoose from "mongoose";

const Schema = mongoose.Schema;

const serviceTranslationSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },

    language: { type: String, required: true, enum: ["pt", "en"] },
    name: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    image: { type: String, required: true },

    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default serviceTranslationSchema;
