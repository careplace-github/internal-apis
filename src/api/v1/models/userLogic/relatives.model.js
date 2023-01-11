import mongoose from "mongoose";

const Schema = mongoose.Schema;

const relativeSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    owner: { type: Schema.ObjectId, ref: "user", required: true },

    avatar: { type: String, required: false },

    name: { type: String, required: true },

    birthDate: { type: Date, required: true },

    age: { type: Number, required: true },

    medicalConditions: {
      bloodType: { type: String, required: false },
      allergies: { type: String, required: false },
      chronicDiseases: { type: String, required: false },
      surgeries: { type: String, required: false },
      medications: { type: String, required: false },
      other: { type: String, required: false },
    },

    address: {
      street: { type: String, required: true },

      postalCode: { type: String, required: true },

      state: { type: String, required: true },

      city: { type: String, required: true },

      country: { type: String, required: true },

      countryId: { type: String, required: true },

      fullAddress: { type: String, required: true },

      // Array of coordinates [longitude, latitude] String
      coordinates: [
        { latitude: { type: String, required: false } },
        { longitude: { type: String, required: false } },
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default relativeSchema;
