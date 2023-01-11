import mongoose from "mongoose";

const Schema = mongoose.Schema;

const templateSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    normalAttribute: {
      type: String,
      required: true,
      unique: false,
      default: "something",
    },

    objectIdAttribute: { type: String, ref: "anotherModel" },

    arrayAttribute: [{ type: String, required: false }],

    enumAttribute: {
      type: String,
      required: true,
      enum: ["something", "somethingElse"],
    },

    validateAttribute: {
      type: String,
      required: true,
      validate(value) {
        if (value !== "something") {
          throw new Error("The attribute must be something");
        }
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
 * @Methods
 */

/**
 * @description Verifies if the Template has the attribute passed as parameter.
 * @param {String} attribute - The attribute to be verified.
 * @returns {Boolean} - Returns true if the Template has the attribute passed as parameter and false if it doesn't.
 */
templateSchema.methods.hasAttribute = function (attribute) {
  return this.schema.path(attribute);
};

export default templateSchema;
