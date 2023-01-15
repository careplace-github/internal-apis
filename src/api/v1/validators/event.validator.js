import { check } from "express-validator";

// -------------------------------------------------------------------------------------------- //
//                                       ADD EVENT VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

const AddEvent_UserValidation = check("user").custom((value) => {
  /**
   * Check if the user is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'user'.");
  }

  /**
   * Check if the user is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'user' parameter must be a string.");
  }

  return true;
});

const AddEvent_TitleValidation = check("title").custom((value) => {
  /**
   * Check if the title is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'title'.");
  }

  /**
   * Check if the title is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'title' parameter must be a string.");
  }

  return true;
});

const AddEvent_DescriptionValidation = check("description")
  .isString()
  .withMessage("The 'description' parameter must be a string.");

const AddEvent_StartValidation = check("start").custom((value) => {
  /**
   * Check if the start is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'start'.");
  }

  /**
   * Check if start is a Date
   */
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error("The 'start' parameter must be a date.");
  }

  /**
   * Check if the date is in the format YYYY-MM-DDT00:00
   */
  const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  if (!dateRegex.test(value)) {
    throw new Error(
      "The 'start' parameter must be in the format YYYY-MM-DDT00:00."
    );
  }

  return true;
});

const AddEvent_EndValidation = check("end").custom((value) => {
  /**
   * Check if the end is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'end'.");
  }

  /**
   * Check if end is a Date
   */
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error("The 'end' parameter must be a date.");
  }

  /**
   * Check if the date is in the format YYYY-MM-DDT00:00
   */
  const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  if (!dateRegex.test(value)) {
    throw new Error(
      "The 'end' parameter must be in the format YYYY-MM-DDT00:00."
    );
  }

  return true;
});

// Check if the end date is after the start date withMessage "The 'end' parameter date must be after the 'start' parameter date."
const AddEvent_EndIsAfterStart = check("end").custom((value, { req }) => {
  if (value < req.body.start) {
    throw new Error(
      "The 'end' parameter date must be after the 'start' parameter date."
    );
  }
  return true;
});

export const AddEventValidator = [
  AddEvent_UserValidation,
  AddEvent_TitleValidation,
  AddEvent_DescriptionValidation,
  AddEvent_StartValidation,
  AddEvent_EndValidation,
  AddEvent_EndIsAfterStart,
];

// -------------------------------------------------------------------------------------------- //
//                                    UPDATE EVENT VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

const UpdateEvent_UserValidation = check("user").custom((value) => {
  if (value !== "" && value !== null && value !== undefined) {
    /**
     * Check if the user is a string
     */
    if (typeof value !== "string") {
      throw new Error("The 'user' parameter must be a string.");
    }
  }
  if (value === "" || value === null) {
    throw new Error("Missing required parameter: 'user'.");
  }

  return true;
});

const UpdateEvent_TitleValidation = check("title").custom((value) => {
  if (value !== "" && value !== null && value !== undefined) {
    /**
     * Check if the title is a string
     */
    if (typeof value !== "string") {
      throw new Error("The 'title' parameter must be a string.");
    }
  }

  if (value === "" || value === null) {
    throw new Error("Missing required parameter: 'title'.");
  }

  return true;
});

const UpdateEvent_DescriptionValidation = check("description").custom(
  (value) => {
    if (value !== "" && value !== null && value !== undefined) {
      /**
       * Check if the description is a string
       */
      if (typeof value !== "string") {
        throw new Error("The 'description' parameter must be a string.");
      }
    }
    return true;
  }
);

const UpdateEvent_StartValidation = check("start").custom((value) => {
  if (value !== "" && value !== null && value !== undefined) {
    /**
     * Check if start is a Date
     */
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new Error("The 'start' parameter must be a date.");
    }

    /**
     * Check if the date is in the format YYYY-MM-DDT00:00
     */
    const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    if (!dateRegex.test(value)) {
      throw new Error(
        "The 'start' parameter must be in the format YYYY-MM-DDT00:00."
      );
    }
  }

  if (value === "" || value === null) {
    throw new Error("Missing required parameter: 'start'.");
  }

  return true;
});

const UpdateEvent_EndValidation = check("end").custom((value) => {
  if (value !== "" && value !== null && value !== undefined) {
    /**
     * Check if end is a Date
     */
    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new Error("The 'end' parameter must be a date.");
    }

    /**
     * Check if the date is in the format YYYY-MM-DDT00:00
     */
    const dateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    if (!dateRegex.test(value)) {
      throw new Error(
        "The 'end' parameter must be in the format YYYY-MM-DDT00:00."
      );
    }
  }

  if (value === "" || value === null) {
    throw new Error("Missing required parameter: 'end'.");
  }

  return true;
});

// Check if the end date is after the start date withMessage "The 'end' parameter date must be after the 'start' parameter date."
const UpdateEvent_EndIsAfterStart = check("end").custom((value, { req }) => {
  if (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    req.body.start !== "" &&
    req.body.start !== null &&
    req.body.start !== undefined
  ) {
    if (value < req.body.start) {
      throw new Error(
        "The 'end' parameter date must be after the 'start' parameter date."
      );
    }
  }
  return true;
});

export const UpdateEventValidator = [
  UpdateEvent_UserValidation,
  UpdateEvent_TitleValidation,
  UpdateEvent_DescriptionValidation,
  UpdateEvent_StartValidation,
  UpdateEvent_EndValidation,
  UpdateEvent_EndIsAfterStart,
];
