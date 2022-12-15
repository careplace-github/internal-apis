import mongoose from "mongoose";


const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    cognitoId: { type: String, required: true, unique: true },

    verified: { type: Boolean, required: true, default: false },

    // User | Admin
    role: { type: String, required: true, default: "user" },

    gender: { type: String, required: true },

    companyId: { type: String, required: false },

    // Marketplace | CRM
    platformAccess: { type: String, required: true },

    // Client -> Marketplace | Caregiver, Team, Board, Owner -> CRM
    userType: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    name: { type: String, required: true },

    photoURL: { type: String, required: false, unique: true },

    phoneNumber: { type: String, required: false, unique: true },

    birthday: { type: Date, required: false },

    age: { type: Number, required: false },

    address: { type: String, required: false },

    city: { type: String, required: false },

    country: { type: String, required: false },

    zipCode: { type: String, required: false },

    createdAt: { type: Date, required: true, default: Date.now() },

  },

  {
    timestamps: true,
  }
);

// Function to check if user is an admin
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Function to return the user role 
userSchema.methods.getRole = function () {
  return this.role;
};

const User = mongoose.model("users", userSchema);
export default User;
