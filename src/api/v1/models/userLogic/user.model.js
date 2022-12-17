import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    cognitoId: { type: String, required: true, unique: true },

    avatar: { type: Schema.ObjectId, ref: "file", required: false },

    company: { type: Schema.ObjectId, ref: "company", required: false },

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    emailVerified: { type: Boolean, required: false, default: false },

    phoneNumber: { type: String, required: false, unique: true },

    phoneNumberVerified: { type: Boolean, required: false, default: false },

    birthDate: { type: Date, required: false },

    age: { type: Number, required: false },

    gender: { type: String, required: true },

    // Make this has not required
    address: {
      street: { type: String, required: false },

      postalCode: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: { type: String, required: false },

      countryId: { type: String, required: false },

      fullAddress: { type: String, required: false },

      // Array of coordinates [longitude, latitude] String
      coordinates: [
        { latitude: { type: String, required: false } },
        { longitude: { type: String, required: false } },
      ],

      // Role: user, caregiver, companyBoard, companyOwner, admin
      role: { type: String, required: true, default: "user" },
  
     

      caregiverInformation : { type: Schema.ObjectId, ref: "caregiverInformation", required: false },

    },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);

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

