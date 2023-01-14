import mongoose from "mongoose";

const Schema = mongoose.Schema;

const relativeSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    relative: { type: Schema.ObjectId, ref: "user", required: true },

    kinship_degree: {
      // What is the kinship degree of the relative to this user
      from: {
        type: String,
        required: true,
        enum: [
          "father",
          "mother",
          "brother",
          "sister",
          "son",
          "daughter",
          "grandfather",
          "grandmother",
          "uncle",
          "aunt",
          "nephew",
          "niece",
          "cousin",
          "friend",
          "other",
        ],
      },
      // What is the kinship degree of this user relative to its relative
      to: {
        type: String,
        required: true,
        enum: [
          "father",
          "mother",
          "brother",
          "sister",
          "son",
          "daughter",
          "grandfather",
          "grandmother",
          "uncle",
          "aunt",
          "nephew",
          "niece",
          "cousin",
          "friend",
          "other",
        ],
      },
    },

    avatar: { type: String, required: false },

    name: { type: String, required: true },

    birth_date: { type: Date, required: true },

    age: { type: Number, required: true },

    gender: { type: String, required: true, enum: ["male","female","other"] },

    medical_conditions: {
      blood_type: { type: String, required: false },
      allergies: { type: String, required: false },
      chronic_diseases: { type: String, required: false },
      surgeries: { type: String, required: false },
      medications: { type: String, required: false },
      other: { type: String, required: false },
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
    },

    created_at: { type: Date, required: true, default: Date.now() },

    updated_at: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);

relativeSchema.methods.getKinshipDegree = function (type) {
  if (type !== "from" || type !== "to") throw new Error("Invalid type");
  return this.kinship_degree.type;
};

export default relativeSchema;
