import mongoose from "mongoose";

let deleted_templates;

const Schema = mongoose.Schema;

const template_schema = new Schema(
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
template_schema.methods.hasAttribute = function (attribute) {
  return this.schema.path(attribute);
};

// Add a pre-save hook to the schema
template_schema.pre("save", function (next) {
  // Do stuff

  next();
});

// Add a pre-remove hook to the schema
template_schema.pre("remove", async function (next) {
  // Do stuff

  // Before deleting the template, add this document to the `templates` collection in `deletes_db` database.
  // This is done to keep a record of the deleted templates.

  const template_to_delete = await deleted_templates.create({
    normalAttribute: this.normalAttribute,
    objectIdAttribute: this.objectIdAttribute,
    arrayAttribute: this.arrayAttribute,
    enumAttribute: this.enumAttribute,
  });

  await template_to_delete.save();

  next();
});

// Add a post-save hook to the schema
template_schema.post("save", function (doc, next) {
  // Do stuff

  next();
});

// Add a post-remove hook to the schema
template_schema.post("remove", function (doc, next) {
  // Do stuff

  next();
});



template_schema.static("injectCollection",  async function (
  deletes_db_connection
) {
  if (deleted_templates) {
    return;
  }

  deleted_templates = await deletes_db_connection.model(
    "Template",
    template_schema
  );
});

export default template_schema;
