import mongoose from "mongoose";

const Schema = mongoose.Schema;

let crmUser;

const crmUserSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognito_id: { type: String, required: true, unique: true },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    birth_date: { type: Date, required: true },

    gender: { type: String, required: true, enum: ["male", "female", "other"] },

    company: { type: Schema.ObjectId, ref: "Company", required: true },

    address: {
      street: { type: String, required: false },

      postal_code: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: {
        type: String,
        required: false,
        enum: ["PT"],
      },

      coordinates: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
      },
    },

    /**
     * @todo
     * Diretor
     * Direção Técnica
     * Assistente Social
     */
    role: {
      type: String,
      required: true,
      enum: ["technical_direction", "social_worker"],
      default: "technical_direction",
    },

    accesses: [
      {
        access: {
          type: String,
          required: true,
          enum: [
            "dashboard",
            "schedule",
            "orders",
            "collaborators",
            "invoicing",
            "chat",
          ],
        },
        view: { type: Boolean, required: true, default: true },
        edit: { type: Boolean, required: true, default: null },
      },
    ],

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
 * Methods
 */

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */

export default crmUser = mongoose.model("crm_users", crmUserSchema);
