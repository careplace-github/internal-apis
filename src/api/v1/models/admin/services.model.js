import mongoose from "mongoose";

let Service;

const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true },

    description: { type: String, required: true },

    short_description: { type: String, required: true },

    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default Service = mongoose.model("Service", serviceSchema);

export { serviceSchema };
