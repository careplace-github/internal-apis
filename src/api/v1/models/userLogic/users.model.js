import mongoose from "mongoose";

const Schema = mongoose.Schema;



const user_schema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognito_id: { type: String, required: true, unique: true },

    // Role: user, caregiver, companyBoard, companyOwner, admin
    role: { type: String, required: true, default: "user" },

    profile_picture: { type: String, required: false },

    company: { type: Schema.ObjectId, ref: "company", required: false },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    email_verified: { type: Boolean, required: false, default: false },

    
    phone: { type: String, required: true, unique: true },

    phone_verified: { type: Boolean, required: false, default: false },




    birth_date: { type: Date, required: false },

    age: { type: Number, required: false },

    gender: { type: String, required: true, enum: ["male","female","other"] },

    relatives: [{ type: Schema.ObjectId, ref: "relative", required: true }],

    caregiver_information: {
      type: Schema.ObjectId,
      ref: "Caregiver",
      required: false,
    },

    address: {
      street: { type: String, required: true },

      postal_code: { type: String, required: true },

      state: { type: String, required: false },

      city: { type: String, required: true },

      country: {
        type: String,
        required: true,
        enum: ["PT", "ES", "US", "UK"],
      },

      coordinates: { type: Array, required: true },
    },

    settings: {
      language: {
        type: String,
        required: true,
        default: "pt",
        enum: ["pt", "en"],
      },
      currency: {
        type: String,
        required: true,
        default: "EUR",
        enum: ["EUR", "USD"],
      },
      timeZone: { type: String, required: true, default: "Europe/Lisbon" },
      timeZoneFomated: { type: String, required: true, default: "GMT" },
      theme: {
        type: String,
        required: true,
        default: "light",
        enum: ["light", "dark"],
      },

      notifications: {
        email: { type: Boolean, required: true, default: true },
        phone: { type: Boolean, required: true, default: true },
        push: { type: Boolean, required: true, default: true },
      },
    },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
    virtuals: true,
  }
);

/**
 * Methods
 */

// Function to check if user is an admin
user_schema.methods.isAdmin = function () {
  return this.role === "admin";
};

user_schema.methods.isCompanyOwner = function () {
  return this.role === "companyOwner";
};

// Function to return the user role
user_schema.methods.getRole = function () {
  return this.role;
};

user_schema.static ("injectCollection", async function (
  deletes_db_connection
) {
  if (deleted_users) {
    return;
  }

  deleted_users = await deletes_db_connection.model(
    "Service",
    user_schema
  );
});

export default user_schema;
