import { check } from "express-validator";

let attributesValidation

export default attributesValidation = check("*").custom((value, { req }) => {
  // Get the list of valid attributes from the orderSchema
  const validAttributes = Object.keys(this.schema.obj);

  // Get the list of attributes from the request body
  const attributes = Object.keys(req.body);

  // Check if there is any attribute that is not in the list of valid attributes
  const extraAttributes = attributes.filter(
    (attribute) => !validAttributes.includes(attribute)
  );

  if (extraAttributes.length > 0) {
    throw new Error(
      `Received invalid parameters: ${extraAttributes.join(", ")}`
    );
  }

  // Check if every attribute has the correct type
  for (const [key, value] of Object.entries(req.body)) {
    // Get the type of the attribute from the Schema
    const type = this.schema.obj[key].type.name;

    // Check if the type of the attribute is correct
    if (typeof value !== type) {
      throw new Error(`The attribute '${key}' must be of type '${type}'.`);
    }
  }

  return true;
});


