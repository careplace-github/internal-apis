import mongoose from "mongoose";

const Schema = mongoose.Schema;

let crmUser;

const crmUserSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognito_id: { type: String, required: true, unique: true },

    profile_picture: { type: String, required: false },

    company: { type: Schema.ObjectId, ref: "Company", required: true },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    birth_date: { type: Date, required: false },

    age: { type: Number, required: false },

    gender: { type: String, required: true, enum: ["male", "female", "other"] },

    caregiver_information: {
      type: Schema.ObjectId,
      ref: "Caregiver",
      required: false,
    },

    address: {
      street: { type: String, required: false },

      postal_code: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: {
        type: String,
        required: false,
        enum: ["PT", "ES", "US", "UK"],
      },

      coordinates: { type: Array, required: true },
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

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: false,
    virtuals: true,
  }
);

/**
 * Methods
 */

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */

export default crmUser = mongoose.model("crm_users", crmUserSchema);
