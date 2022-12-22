import mongoose from "mongoose";

const Schema = mongoose.Schema;

const relativeSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    owner: { type: Schema.ObjectId, ref: "user", required: true },

    avatar: { type: Schema.ObjectId, ref: "file", required: false },

    name: { type: String, required: true },

    birthDate: { type: Date, required: false },

    age: { type: Number, required: false },

    medicalConditions: {
      bloodType: { type: String, required: false },
      allergies: { type: String, required: false },
      chronicDiseases: { type: String, required: false },
      surgeries: { type: String, required: false },
      medications: { type: String, required: false },
      other: { type: String, required: false },
    },

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
    },
  },
  {
    timestamps: true,
  }
);

export default relativeSchema;
