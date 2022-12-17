
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const fileSchema = new Schema(
  {

    _id: Schema.Types.ObjectId,

    // Owner of file. This is the user that uploaded the file.
    Owner: { type: Schema.ObjectId, ref: "user", required: true },

    // Name of file.
    name: { type: String, required: true},

    // URL of file (AWS S3 URL). This is the URL that will be used to access the file. 
    url: { type: String, required: true, unique: true },

    // Enumerate type of file: avatar, banner, etc. 
    type: { type: String, required: true },

    // Extension of file: jpg, png, mp4, pdf, etc.
    extension: { type: String, required: true },

    // Size of file in bytes
    size: { type: Number, required: true },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },

    },

    {

    timestamps: true,

    }

);

export default mongoose.model("file", fileSchema);





