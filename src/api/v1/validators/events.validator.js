import { check } from "express-validator";
import eventSchema from "../models/app/calendar/events.model.js";

// -------------------------------------------------------------------------------------------- //
//                                       ADD EVENT VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

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
  AddEvent_TitleValidation,
  AddEvent_DescriptionValidation,
  AddEvent_StartValidation,
  AddEvent_EndValidation,
  AddEvent_EndIsAfterStart,
];

// -------------------------------------------------------------------------------------------- //
//                                    UPDATE EVENT VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

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
  UpdateEvent_TitleValidation,
  UpdateEvent_DescriptionValidation,
  UpdateEvent_StartValidation,
  UpdateEvent_EndValidation,
  UpdateEvent_EndIsAfterStart,
];
