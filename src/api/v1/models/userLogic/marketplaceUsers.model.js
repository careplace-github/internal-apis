import mongoose from "mongoose";

const Schema = mongoose.Schema;

let marketplaceUser;

const marketplaceUserSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognito_id: { type: String, required: true, unique: true },

    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: { type: String, required: true, unique: true },

    birthdate: { type: Date, required: false },

    age: { type: Number, required: false },

    gender: {
      type: String,
      required: false,
      enum: ["male", "female", "other"],
    },

    address: {
      street: { type: String, required: false },

      postal_code: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: {
        type: String,
        required: true,
        enum: ["PT"],
      },

      coordinates: { type: Array, required: true },
    },

    stripe_information: {
      customer_id: { type: String, required: false },
    },

    settings: {
      theme: {
        type: String,
        required: true,
        default: "light",
        enum: ["light", "dark"],
      },

      notifications: {
        email: { type: Boolean, required: true, default: true },
        sms: { type: Boolean, required: true, default: true },
        push: { type: Boolean, required: true, default: true },
      },
    },

    profile_picture: { type: String, required: false },
  },

  {
    timestamps: false,
    virtuals: true,
  }
);

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */

export default marketplaceUser = mongoose.model(
  "marketplace_users",
  marketplaceUserSchema
);
