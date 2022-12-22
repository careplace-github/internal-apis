import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognitoId: { type: String, required: true, unique: true },

    // Role: user, caregiver, companyBoard, companyOwner, admin
    role: { type: String, required: true, default: "user" },

    profilePicture: { type: String, required: false },

    company: { type: Schema.ObjectId, ref: "company", required: false },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    emailVerified: { type: Boolean, required: false, default: false },

    phoneNumberCountryCode: {
      type: String,
      required: true,
      enum: ["+351", "+34", "+1", "+44"],
    },

    // Verify if the phone number doesn't have any spaces and if doesn't have any special characters. If it does, remove them.
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      validate(value) {
        if (value.includes(" ")) {
          // Remove all spaces from the phone number
          value = value.replace(/\s/g, "");
        } else if (value.startsWith(this.phoneNumberCountryCode)) {
          // Remove all the special characters from the phone number
          value = value.replace(/[^0-9]/g, "");
        }
      },
    },

    phoneNumberVerified: { type: Boolean, required: false, default: false },

    birthDate: { type: Date, required: false },

    age: { type: Number, required: false },

    gender: { type: String, required: true },

    relatives: [{ type: Schema.ObjectId, ref: "relative", required: true }],

    caregiverInformation: {
      type: Schema.ObjectId,
      ref: "caregiver",
      required: false,
    },

    address: {
      street: { type: String, required: false },

      postalCode: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: { type: String, required: false },

      countryId: {
        type: String,
        required: true,
        enum: ["PT", "ES", "US", "UK"],
      },
      // Check if full address is equal to street + postalCode + city + state + country
      // If it's not equal, add the missing information to the full address
      fullAddress: {
        type: String,
        required: true,
        validate(value) {
          if (
            value !==
            this.street +
              ", " +
              this.postalCode +
              ", " +
              this.city +
              ", " +
              this.state +
              ", " +
              this.country
          ) {
            value =
              this.street +
              ", " +
              this.postalCode +
              ", " +
              this.city +
              ", " +
              this.state +
              ", " +
              this.country;
          }
        },
      },

      // Array of coordinates [longitude, latitude] String
      coordinates: [
        { latitude: { type: String, required: false } },
        { longitude: { type: String, required: false } },
      ],
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

export default userSchema;
