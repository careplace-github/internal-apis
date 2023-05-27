import mongoose from "mongoose";

let Service;

const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true },

    description: { type: String, required: true , default: ""},

    short_description: { type: String, required: true, default: "" },

    image: { type: String, required: true, default: ""},

    icon: { type: String, required: false},

    type: {type: String, required: true, enum: ["special", "normal"], default: "normal"},
  },
  {
    timestamps: true,
  }
);

export default Service = mongoose.model("Service", serviceSchema);

export { serviceSchema };
