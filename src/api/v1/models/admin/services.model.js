import mongoose from "mongoose";

const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  _id: Schema.Types.ObjectId,

  name: { type: String, required: false, unique: true },

  description: { type: String, required: false },

  shortDescription: { type: String, required: false },

  photo: { type: String, required: false},

});

export default serviceSchema;
