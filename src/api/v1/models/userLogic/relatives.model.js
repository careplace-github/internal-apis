import mongoose from "mongoose";

const Schema = mongoose.Schema;

let Relative;

const relativeSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    user: { type: Schema.ObjectId, ref: "marketplace_users", required: true },

    kinship: {
      // What is the kinship degree of the relative to this user
      from: {
        type: String,
        required: false,
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
        required: false,
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

    profile_picture: { type: String, required: false },

    name: { type: String, required: true },

    birthdate: { type: Date, required: true },

    gender: {
      type: String,
      required: false,
      enum: ["male", "female", "other"],
    },

    medical_conditions: {
      type: [String],
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
    },
  },

  {
    timestamps: true,
  }
);

relativeSchema.methods.getKinshipDegree = function (type) {
  if (type !== "from" || type !== "to") throw new Error("Invalid type");
  return this.kinship_degree.type;
};

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Relative = mongoose.model("Relative", relativeSchema);
