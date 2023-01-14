import mongoose from "mongoose";

let deleted_services;

const Schema = mongoose.Schema;

const service_schema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true },

    description: { type: String, required: true },

    short_description: { type: String, required: true },

    image: { type: String, required: true },

    translations: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceTranslation",
        required: false,
      },
    ],

    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

service_schema.static ("injectCollection", async function (
  deletes_db_connection
) {
  if (deleted_services) {
    return;
  }

  deleted_services = deletes_db_connection.model(
    "Service",
    service_schema
  );
});







export default service_schema;
