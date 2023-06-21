import { check } from "express-validator";
import orderSchema from "../models/app/orders/orders.model";

// -------------------------------------------------------------------------------------------- //
//                                       ADD ORDER VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

// If there is any other attribute that is not in the list of valid attributes, throw an error
const AddOrder_AttributesValidation = check("*").custom((value, { req }) => {
  // Get the list of valid attributes from the orderSchema
  const validAttributes = Object.keys(orderSchema.obj);

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
});

const AddOrder_CompanyValidation = check("company").custom((value) => {
  /**
   * Check if the company is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'company'.");
  }

  /**
   * Check if the Company is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'company' parameter must be a string.");
  }

  return true;
});

const AddOrder_CustomerValidation = check("customer").custom((value) => {
  /**
   * Check if the customer is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'customer'.");
  }

  /**
   * Check if the customer is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'customer' parameter must be a string.");
  }

  return true;
});

const AddOrder_ClientValidation = check("client").custom((value) => {
  /**
   * Check if the user is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'client'.");
  }

  /**
   * Check if the user is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'client' parameter must be a string.");
  }

  return true;
});

const AddOrder_ServicesValidation = check("services").custom((value) => {
  /**
   * Check if the services is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'services'.");
  }

  /**
   * Check if the services is an array
   */
  if (!Array.isArray(value)) {
    throw new Error("The 'services' parameter must be an array.");
  }

  /**
   * Check if the services array objects are all strings
   */

  value.forEach((service) => {
    if (typeof service !== "string") {
      throw new Error(
        "The 'services' parameter must be an array of strings with the _id of each service."
      );
    }
  });

  /**
   * Checks if the _id of each service is a valid _id by checking if it one of the Services from the "./src/assets/data/serviceson" file
   */

  const services = require("../../assets/data/serviceson");
  const servicesIds = services.map((service) => service._id);

  value.forEach((service) => {
    if (!servicesIds.includes(service._id)) {
      throw new Error(
        `The service with the _id: ${service._id} is not a valid service.`
      );
    }
  });

  return true;
});

const AddOrder_ScheduleInformationValidation = check(
  "schedule_information"
).custom((value) => {
  /**
   * Check if the schedule_information is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'schedule_information'.");
  }

  /**
   * Check if the schedule_information is an object
   */
  if (typeof value !== "object") {
    throw new Error("The 'schedule_information' parameter must be an object.");
  }

  /**
   * Check if the schedule_information object has the required properties
   */
  if (!value.hasOwnProperty("start_date")) {
    throw new Error(
      "The 'schedule_information' parameter must have the properties 'start_date'."
    );
  }
  /**
   * Check if the start_date is a Date
   */
  const startDate = new Date(value.start_date);

  if (isNaN(date.startDate())) {
    throw new Error(
      "The 'start_date' property of the 'schedule_information' parameter must be a date."
    );
  }

  /**
   * Check if the start_date is in the format YYYY-MM-DD
   */
  const startDateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!startDateRegex.test(value.start_date)) {
    throw new Error(
      "The 'start_date' property of the 'schedule_information' parameter must be in the format YYYY-MM-DD."
    );
  }

  if (!value.hasOwnProperty("end_date")) {
    throw new Error(
      "The 'schedule_information' parameter must have the properties 'end_date'."
    );
  }

  /**
   * Check if the start_date is a Date
   */
  const endDate = new Date(value.end_date);

  if (isNaN(endDate.getTime())) {
    throw new Error(
      "The 'end_date' property of the 'schedule_information' parameter must be a date."
    );
  }

  /**
   * Check if the start_date is in the format YYYY-MM-DD
   */
  const endDateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!endDateRegex.test(value.end_date)) {
    throw new Error(
      "The 'end_date' property of the 'schedule_information' parameter must be in the format YYYY-MM-DD."
    );
  }

  if (
    value.recurrency_type === "" ||
    value.recurrency_type === null ||
    value.recurrency_type === undefined
  ) {
    throw new Error("Missing required parameter: 'recurrency_type'.");
  }

  if (typeof value.recurrency_type !== "number") {
    throw new Error(
      "The 'recurrency_type' property of the 'schedule_information' parameter must be a number."
    );
  }

  // C
  if (
    value.recurrency_type !== 0 &&
    value.recurrency_type !== 1 &&
    value.recurrency_type !== 2 &&
    value.recurrency_type !== 4
  ) {
    throw new Error(
      "The 'recurrency_type' property of the 'schedule_information' parameter must be a number with the value 0, 1, 2 or 4."
    );
  }

  /**
   * Check if the recurrency_type is not empty and if it is not check if it is a number and if it is a valid recurrency_type (it can be 0, 1, 2 or 4).
   * Then, check if the schedule parameter inside the schedule_information object is not empty and if it is not check if it is an Array and if it is a valid schedule parameter.
   * To be a valid schedule parameter it must be an Array and each element of the Array must be an object with the properties: week_day, start_time and end_time. The week_day must be a number between 1 and 7, the start_time and end_time must be a String in the format HH:MM.
   */

  /**
   * Order is recurrent
   */
  if (value.recurrency_type !== 0) {
    if (!value.hasOwnProperty("schedule")) {
      throw new Error(
        "The 'schedule_information' parameter must have the properties 'schedule'."
      );
    }

    if (
      value.schedule === "" ||
      value.schedule === null ||
      value.schedule === undefined
    ) {
      throw new Error("Missing required parameter: 'schedule'.");
    }

    if (!Array.isArray(value.schedule)) {
      throw new Error(
        "The 'schedule' property of the 'schedule_information' parameter must be an Array."
      );
    }

    value.schedule.forEach((schedule) => {
      if (typeof schedule !== "object") {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects."
        );
      }

      if (!schedule.hasOwnProperty("week_day")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (!schedule.hasOwnProperty("start_time")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (!schedule.hasOwnProperty("end_time")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (typeof schedule.week_day !== "number") {
        throw new Error(
          "The 'week_day' property of the 'schedule' property of the 'schedule_information' parameter must be a number."
        );
      }

      if (schedule.week_day < 1 || schedule.week_day > 7) {
        throw new Error(
          "The 'week_day' property of the 'schedule' property of the 'schedule_information' parameter must be a number between 1 and 7."
        );
      }

      if (typeof schedule.start_time !== "string") {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be a string."
        );
      }

      if (typeof schedule.end_time !== "string") {
        throw new Error(
          "The 'end_time' property of the 'schedule' property of the 'schedule_information' parameter must be a string."
        );
      }

      const startTimeRegex = new RegExp(/^\d{2}:\d{2}$/);
      if (!startTimeRegex.test(schedule.start_time)) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be in the format HH:MM."
        );
      }

      const endTimeRegex = new RegExp(/^\d{2}:\d{2}$/);
      if (!endTimeRegex.test(schedule.end_time)) {
        throw new Error(
          "The 'end_time' property of the 'schedule' property of the 'schedule_information' parameter must be in the format HH:MM."
        );
      }

      // Check if the start_time is before the end_time
      const startTime = schedule.start_time.split(":");
      const endTime = schedule.end_time.split(":");
      if (startTime[0] > endTime[0]) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be before the 'end_time' property."
        );
      }

      if (startTime[0] === endTime[0] && startTime[1] >= endTime[1]) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be before the 'end_time' property."
        );
      }
    });
  }

  return true;
});

const AddOrder_StripeSubscriptionIdValidation = check(
  "stripe_subscription_id"
).custom((value) => {
  // Check if the stripe_subscription_id is not empty and is a string
  if (
    value.stripe_subscription_id === "" ||
    value.stripe_subscription_id === null ||
    value.stripe_subscription_id === undefined
  ) {
    throw new Error("Missing required parameter: 'stripe_subscription_id'.");
  }

  if (typeof value.stripe_subscription_id !== "string") {
    throw new Error(
      "The 'stripe_subscription_id' property of the 'schedule_information' parameter must be a string."
    );
  }

  return true;
});

const AddOrder_BillingAddressValidation = check("billing_address").custom(
  (value) => {
    // Check if the billing_address is not empty and is an object with the properties 'street', 'postal_code', 'city', and 'country'.
    // The street, postal_code, city and country properties must be strings
    if (
      value.billing_address === "" ||
      value.billing_address === null ||
      value.billing_address === undefined
    ) {
      throw new Error("Missing required parameter: 'billing_address'.");
    }

    if (typeof value.billing_address !== "object") {
      throw new Error(
        "The 'billing_address' property of the 'schedule_information' parameter must be an object with the following properties: 'street', 'postal_code', 'city', and 'country'."
      );
    }

    // Check if the street property is not empty and is a string
    if (
      value.billing_address.street === "" ||
      value.billing_address.street === null ||
      value.billing_address.street === undefined
    ) {
      throw new Error("Missing required parameter: 'street'.");
    }

    if (typeof value.billing_address.street !== "string") {
      throw new Error(
        "The 'street' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the postal_code property is not empty and is a string
    if (
      value.billing_address.postal_code === "" ||
      value.billing_address.postal_code === null ||
      value.billing_address.postal_code === undefined
    ) {
      throw new Error("Missing required parameter: 'postal_code'.");
    }

    if (typeof value.billing_address.postal_code !== "string") {
      throw new Error(
        "The 'postal_code' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the city property is not empty and is a string
    if (
      value.billing_address.city === "" ||
      value.billing_address.city === null ||
      value.billing_address.city === undefined
    ) {
      throw new Error("Missing required parameter: 'city'.");
    }

    if (typeof value.billing_address.city !== "string") {
      throw new Error(
        "The 'city' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the country property is not empty and is a string
    if (
      value.billing_address.country === "" ||
      value.billing_address.country === null ||
      value.billing_address.country === undefined
    ) {
      throw new Error("Missing required parameter: 'country'.");
    }

    if (typeof value.billing_address.country !== "string") {
      throw new Error(
        "The 'country' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the property country is a valid country code by checking if it is in the list of countries from the "./src/assets/data/countries" file.
    // The countries in this file are in an Array that contains objects in the format { code: "PT", label: "Portugal", phone: "351" }
    const countries = require("../assets/data/countries");

    let countryFound = false;
    for (let i = 0; i < countries.length; i++) {
      if (countries[i].code === value.billing_address.country) {
        countryFound = true;
        break;
      }
    }

    if (!countryFound) {
      throw new Error(
        "The 'country' property of the 'billing_address' property of the 'schedule_information' parameter must be a valid country code."
      );
    }

    return true;
  }
);

export const AddOrderValidator = [
  AddOrder_AttributesValidation,
  AddOrder_CompanyValidation,
  AddOrder_CustomerValidation,
  AddOrder_ClientValidation,
  AddOrder_ServicesValidation,
  AddOrder_ScheduleInformationValidation,
  AddOrder_StripeSubscriptionIdValidation,
  AddOrder_BillingAddressValidation,
];

// -------------------------------------------------------------------------------------------- //
//                                    UPDATE ORDER VALIDATOR                                    //
// -------------------------------------------------------------------------------------------- //

// If there is any other attribute that is not in the list of valid attributes, throw an error
const UpdateOrder_AttributesValidation = check("*").custom((value, { req }) => {
  // Get the list of valid attributes from the orderSchema
  const validAttributes = Object.keys(orderSchema.obj);

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
});

const UpdateOrder_CompanyValidation = check("company").custom((value) => {
  /**
   * Check if the company is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'company'.");
  }

  /**
   * Check if the Company is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'company' parameter must be a string.");
  }

  return true;
});

const UpdateOrder_CaregiverValidation = check("caregiver").custom((value) => {
  /**
   * Check if the caregiver is not empty
   *  */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'caregiver'.");
  }

  /**
   * Check if the caregiver is a string
   * */
  if (typeof value !== "string") {
    throw new Error("The 'caregiver' parameter must be a string.");
  }

  return true;
});

const UpdateOrder_CustomerValidation = check("customer").custom((value) => {
  /**
   * Check if the customer is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'customer'.");
  }

  /**
   * Check if the customer is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'customer' parameter must be a string.");
  }

  return true;
});

const UpdateOrder_ClientValidation = check("client").custom((value) => {
  /**
   * Check if the user is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'client'.");
  }

  /**
   * Check if the user is a string
   */
  if (typeof value !== "string") {
    throw new Error("The 'client' parameter must be a string.");
  }

  return true;
});

const UpdateOrder_ServicesValidation = check("services").custom((value) => {
  /**
   * Check if the services is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'services'.");
  }

  /**
   * Check if the services is an array
   */
  if (!Array.isArray(value)) {
    throw new Error("The 'services' parameter must be an array.");
  }

  /**
   * Check if the services array objects are all strings
   */

  value.forEach((service) => {
    if (typeof service !== "string") {
      throw new Error(
        "The 'services' parameter must be an array of strings with the _id of each service."
      );
    }
  });

  /**
   * Checks if the _id of each service is a valid _id by checking if it one of the Services from the "./src/assets/data/serviceson" file
   */

  const services = require("../../assets/data/serviceson");
  const servicesIds = services.map((service) => service._id);

  value.forEach((service) => {
    if (!servicesIds.includes(service._id)) {
      throw new Error(
        `The service with the _id: ${service._id} is not a valid service.`
      );
    }
  });

  return true;
});

const UpdateOrder_ScheduleInformationValidation = check(
  "schedule_information"
).custom((value) => {
  /**
   * Check if the schedule_information is not empty
   */
  if (value === "" || value === null || value === undefined) {
    throw new Error("Missing required parameter: 'schedule_information'.");
  }

  /**
   * Check if the schedule_information is an object
   */
  if (typeof value !== "object") {
    throw new Error("The 'schedule_information' parameter must be an object.");
  }

  /**
   * Check if the schedule_information object has the required properties
   */
  if (!value.hasOwnProperty("start_date")) {
    throw new Error(
      "The 'schedule_information' parameter must have the properties 'start_date'."
    );
  }
  /**
   * Check if the start_date is a Date
   */
  const startDate = new Date(value.start_date);

  if (isNaN(date.startDate())) {
    throw new Error(
      "The 'start_date' property of the 'schedule_information' parameter must be a date."
    );
  }

  /**
   * Check if the start_date is in the format YYYY-MM-DD
   */
  const startDateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!startDateRegex.test(value.start_date)) {
    throw new Error(
      "The 'start_date' property of the 'schedule_information' parameter must be in the format YYYY-MM-DD."
    );
  }

  if (!value.hasOwnProperty("end_date")) {
    throw new Error(
      "The 'schedule_information' parameter must have the properties 'end_date'."
    );
  }

  /**
   * Check if the start_date is a Date
   */
  const endDate = new Date(value.end_date);

  if (isNaN(endDate.getTime())) {
    throw new Error(
      "The 'end_date' property of the 'schedule_information' parameter must be a date."
    );
  }

  /**
   * Check if the start_date is in the format YYYY-MM-DD
   */
  const endDateRegex = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
  if (!endDateRegex.test(value.end_date)) {
    throw new Error(
      "The 'end_date' property of the 'schedule_information' parameter must be in the format YYYY-MM-DD."
    );
  }

  if (
    value.recurrency_type === "" ||
    value.recurrency_type === null ||
    value.recurrency_type === undefined
  ) {
    throw new Error("Missing required parameter: 'recurrency_type'.");
  }

  if (typeof value.recurrency_type !== "number") {
    throw new Error(
      "The 'recurrency_type' property of the 'schedule_information' parameter must be a number."
    );
  }

  // C
  if (
    value.recurrency_type !== 0 &&
    value.recurrency_type !== 1 &&
    value.recurrency_type !== 2 &&
    value.recurrency_type !== 4
  ) {
    throw new Error(
      "The 'recurrency_type' property of the 'schedule_information' parameter must be a number with the value 0, 1, 2 or 4."
    );
  }

  /**
   * Check if the recurrency_type is not empty and if it is not check if it is a number and if it is a valid recurrency_type (it can be 0, 1, 2 or 4).
   * Then, check if the schedule parameter inside the schedule_information object is not empty and if it is not check if it is an Array and if it is a valid schedule parameter.
   * To be a valid schedule parameter it must be an Array and each element of the Array must be an object with the properties: week_day, start_time and end_time. The week_day must be a number between 1 and 7, the start_time and end_time must be a String in the format HH:MM.
   */

  /**
   * Order is recurrent
   */
  if (value.recurrency_type !== 0) {
    if (!value.hasOwnProperty("schedule")) {
      throw new Error(
        "The 'schedule_information' parameter must have the properties 'schedule'."
      );
    }

    if (
      value.schedule === "" ||
      value.schedule === null ||
      value.schedule === undefined
    ) {
      throw new Error("Missing required parameter: 'schedule'.");
    }

    if (!Array.isArray(value.schedule)) {
      throw new Error(
        "The 'schedule' property of the 'schedule_information' parameter must be an Array."
      );
    }

    value.schedule.forEach((schedule) => {
      if (typeof schedule !== "object") {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects."
        );
      }

      if (!schedule.hasOwnProperty("week_day")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (!schedule.hasOwnProperty("start_time")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (!schedule.hasOwnProperty("end_time")) {
        throw new Error(
          "The 'schedule' property of the 'schedule_information' parameter must be an Array of objects with the properties 'week_day', 'start_time' and 'end_time'."
        );
      }

      if (typeof schedule.week_day !== "number") {
        throw new Error(
          "The 'week_day' property of the 'schedule' property of the 'schedule_information' parameter must be a number."
        );
      }

      if (schedule.week_day < 1 || schedule.week_day > 7) {
        throw new Error(
          "The 'week_day' property of the 'schedule' property of the 'schedule_information' parameter must be a number between 1 and 7."
        );
      }

      if (typeof schedule.start_time !== "string") {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be a string."
        );
      }

      if (typeof schedule.end_time !== "string") {
        throw new Error(
          "The 'end_time' property of the 'schedule' property of the 'schedule_information' parameter must be a string."
        );
      }

      const startTimeRegex = new RegExp(/^\d{2}:\d{2}$/);
      if (!startTimeRegex.test(schedule.start_time)) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be in the format HH:MM."
        );
      }

      const endTimeRegex = new RegExp(/^\d{2}:\d{2}$/);
      if (!endTimeRegex.test(schedule.end_time)) {
        throw new Error(
          "The 'end_time' property of the 'schedule' property of the 'schedule_information' parameter must be in the format HH:MM."
        );
      }

      // Check if the start_time is before the end_time
      const startTime = schedule.start_time.split(":");
      const endTime = schedule.end_time.split(":");
      if (startTime[0] > endTime[0]) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be before the 'end_time' property."
        );
      }

      if (startTime[0] === endTime[0] && startTime[1] >= endTime[1]) {
        throw new Error(
          "The 'start_time' property of the 'schedule' property of the 'schedule_information' parameter must be before the 'end_time' property."
        );
      }
    });
  }

  return true;
});

const UpdateOrder_StripeSubscriptionIdValidation = check(
  "stripe_subscription_id"
).custom((value) => {
  // Check if the stripe_subscription_id is not empty and is a string
  if (
    value.stripe_subscription_id === "" ||
    value.stripe_subscription_id === null ||
    value.stripe_subscription_id === undefined
  ) {
    throw new Error("Missing required parameter: 'stripe_subscription_id'.");
  }

  if (typeof value.stripe_subscription_id !== "string") {
    throw new Error(
      "The 'stripe_subscription_id' property of the 'schedule_information' parameter must be a string."
    );
  }

  return true;
});

const UpdateOrder_BillingAddressValidation = check("billing_address").custom(
  (value) => {
    // Check if the billing_address is not empty and is an object with the properties 'street', 'postal_code', 'city', and 'country'.
    // The street, postal_code, city and country properties must be strings
    if (
      value.billing_address === "" ||
      value.billing_address === null ||
      value.billing_address === undefined
    ) {
      throw new Error("Missing required parameter: 'billing_address'.");
    }

    if (typeof value.billing_address !== "object") {
      throw new Error(
        "The 'billing_address' property of the 'schedule_information' parameter must be an object with the following properties: 'street', 'postal_code', 'city', and 'country'."
      );
    }

    // Check if the street property is not empty and is a string
    if (
      value.billing_address.street === "" ||
      value.billing_address.street === null ||
      value.billing_address.street === undefined
    ) {
      throw new Error("Missing required parameter: 'street'.");
    }

    if (typeof value.billing_address.street !== "string") {
      throw new Error(
        "The 'street' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the postal_code property is not empty and is a string
    if (
      value.billing_address.postal_code === "" ||
      value.billing_address.postal_code === null ||
      value.billing_address.postal_code === undefined
    ) {
      throw new Error("Missing required parameter: 'postal_code'.");
    }

    if (typeof value.billing_address.postal_code !== "string") {
      throw new Error(
        "The 'postal_code' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the city property is not empty and is a string
    if (
      value.billing_address.city === "" ||
      value.billing_address.city === null ||
      value.billing_address.city === undefined
    ) {
      throw new Error("Missing required parameter: 'city'.");
    }

    if (typeof value.billing_address.city !== "string") {
      throw new Error(
        "The 'city' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the country property is not empty and is a string
    if (
      value.billing_address.country === "" ||
      value.billing_address.country === null ||
      value.billing_address.country === undefined
    ) {
      throw new Error("Missing required parameter: 'country'.");
    }

    if (typeof value.billing_address.country !== "string") {
      throw new Error(
        "The 'country' property of the 'billing_address' property of the 'schedule_information' parameter must be a string."
      );
    }

    // Check if the property country is a valid country code by checking if it is in the list of countries from the "./src/assets/data/countries" file.
    // The countries in this file are in an Array that contains objects in the format { code: "PT", label: "Portugal", phone: "351" }
    const countries = require("../assets/data/countries");

    let countryFound = false;
    for (let i = 0; i < countries.length; i++) {
      if (countries[i].code === value.billing_address.country) {
        countryFound = true;
        break;
      }
    }

    if (!countryFound) {
      throw new Error(
        "The 'country' property of the 'billing_address' property of the 'schedule_information' parameter must be a valid country code."
      );
    }

    return true;
  }
);

const UpdateOrder_OrderStatusValidation = check("order_status").custom(
  (value) => {
    // Check if the order_status is not empty and if it is a String
    if (
      value.order_status === "" ||
      value.order_status === null ||
      value.order_status === undefined
    ) {
      throw new Error("Missing required parameter: 'order_status'.");
    }

    if (typeof value.order_status !== "string") {
      throw new Error("The 'order_status' parameter must be a string.");
    }

    // Check if the order_status is a valid order_status: new, pending, active, cancelled, inactive
    const validOrderStatuses = [
      "new",
      "pending",
      "active",
      "cancelled",
      "inactive",
    ];

    if (!validOrderStatuses.includes(value.order_status)) {
      throw new Error(
        "The 'order_status' parameter must be a valid order status."
      );
    }

    return true;
  }
);

const UpdateOrder_ScreeningVisitValidation = check("screening_visit").custom(
  (value) => {
    // Check if the screening_visit is not empty (it is not mandatory) and if not check if it is an Object with the properties date and status.
    // TCheck if the property date is a Date and if it is in the format YYYY-MM-DDT00:00, and the status must be a String with the values "scheduled", "completed", "pending" or "cancelled".
    // If the screening_visit has the property "event" it must be a string.

    if (
      value.screening_visit !== "" &&
      value.screening_visit !== null &&
      value.screening_visit !== undefined
    ) {
      if (typeof value.screening_visit !== "object") {
        throw new Error("The 'screening_visit' parameter must be an object.");
      }

      if (
        value.screening_visit.date === "" ||
        value.screening_visit.date === null ||
        value.screening_visit.date === undefined
      ) {
        throw new Error("Missing required parameter: 'date'.");
      }

      // Check if the date is a Date
      const date = new Date(value.date);

      if (isNaN(date.getTime())) {
        throw new Error("The 'start' parameter must be a date.");
      }

      // Check if the date is in the format YYYY-MM-DDT00:00
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

      if (!dateRegex.test(value.screening_visit.date)) {
        throw new Error(
          "The 'date' parameter must be in the format YYYY-MM-DDT00:00."
        );
      }

      if (
        value.screening_visit.status === "" ||
        value.screening_visit.status === null ||
        value.screening_visit.status === undefined
      ) {
        throw new Error("Missing required parameter: 'status'.");
      }

      if (typeof value.screening_visit.status !== "string") {
        throw new Error("The 'status' parameter must be a string.");
      }

      const validStatuses = ["scheduled", "completed", "pending", "cancelled"];

      if (!validStatuses.includes(value.screening_visit.status)) {
        throw new Error("The 'status' parameter must be a valid status.");
      }

      if (
        value.screening_visit.event !== "" &&
        value.screening_visit.event !== null &&
        value.screening_visit.event !== undefined
      ) {
        if (typeof value.screening_visit.event !== "string") {
          throw new Error("The 'event' parameter must be a string.");
        }
      }
    }

    return true;
  }
);

const UpdateOrder_ActualStartDate = check("actual_start_date").custom(
  (value) => {
    // Check if the actual_start_date is not empty (it is not mandatory) and if not check if it is a Date in the format YYYY-MM-DDT00:00

    if (
      value.actual_start_date !== "" &&
      value.actual_start_date !== null &&
      value.actual_start_date !== undefined
    ) {
      // Check if the date is a Date
      const date = new Date(value.actual_start_date);

      if (isNaN(date.getTime())) {
        throw new Error("The 'actual_start_date' parameter must be a date.");
      }

      // Check if the date is in the format YYYY-MM-DDT00:00
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

      if (!dateRegex.test(value.actual_start_date)) {
        throw new Error(
          "The 'actual_start_date' parameter must be in the format YYYY-MM-DDT00:00."
        );
      }
    }

    return true;
  }
);

const UpdateOrder_Observations = check("observations").custom((value) => {
  // Check if the observations is not empty (it is not mandatory) and if not check if it is a String

  if (
    value.observations !== "" &&
    value.observations !== null &&
    value.observations !== undefined
  ) {
    if (typeof value.observations !== "string") {
      throw new Error("The 'observations' parameter must be a string.");
    }
  }

  return true;
});

export const UpdateOrderValidator = [
  UpdateOrder_AttributesValidation,
  UpdateOrder_CompanyValidation,
  UpdateOrder_CaregiverValidation,
  UpdateOrder_CustomerValidation,
  UpdateOrder_ClientValidation,
  UpdateOrder_ServicesValidation,
  UpdateOrder_ScheduleInformationValidation,
  UpdateOrder_StripeSubscriptionIdValidation,
  UpdateOrder_BillingAddressValidation,
  UpdateOrder_OrderStatusValidation,
  UpdateOrder_ScreeningVisitValidation,
  UpdateOrder_ActualStartDate,
  UpdateOrder_Observations,
];
