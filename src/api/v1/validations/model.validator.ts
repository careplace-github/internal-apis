import { check, ValidationChain } from 'express-validator';

/**
 * Generic validator to check compliance with a data model.
 * @param model The data model to validate against.
 * @returns An array of validation middleware functions.
 */
export function createModelValidator<T>(model: any): ValidationChain[] {
  const validations: ValidationChain[] = [];

  // Iterate over the properties of the data model
  for (const property in model) {
    if (model.hasOwnProperty(property)) {
      const validation = check(property)
        .exists()
        .withMessage(`Missing required parameter: '${property}'.`)
        .custom((value) => {
          if (typeof value !== typeof model[property]) {
            throw new Error(
              `The '${property}' parameter must be of type ${typeof model[property]}.`
            );
          }
          return true;
        });

      validations.push(validation);
    }
  }

  return validations;
}
