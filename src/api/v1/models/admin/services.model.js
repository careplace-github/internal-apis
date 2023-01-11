import mongoose from "mongoose";

const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true },

    description: { type: String, required: true },

    shortDescription: { type: String, required: true },

    image: { type: String, required: true },

    translations: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceTranslation",
        required: false,
      },
    ],

    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default serviceSchema;
