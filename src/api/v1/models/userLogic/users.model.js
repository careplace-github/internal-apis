import mongoose from "mongoose";

const Schema = mongoose.Schema;

let User;

const userSchema = new Schema(
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

    gender: { type: String, required: true, enum: ["male", "female", "other"] },

    relatives: [{ type: Schema.ObjectId, ref: "relative", required: true }],

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

    stripe_information: {
      customer_id: { type: String, required: false },
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
    timestamps: false,
    virtuals: true,
  }
);

/**
 * Methods
 */

// Function to check if user is an admin
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

userSchema.methods.isCompanyOwner = function () {
  return this.role === "companyOwner";
};

// Function to return the user role
userSchema.methods.getRole = function () {
  return this.role;
};

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */

export default User = mongoose.model("user", userSchema);
