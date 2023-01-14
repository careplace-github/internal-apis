import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    business_profile: {
      name: { type: String, required: true, unique: true },

      email: { type: String, required: true, unique: true },

      phone: { type: String, required: true, unique: true },

      website: { type: String, required: false, unique: true },

      logo: { type: String, required: false },

      banner: { type: String, required: false },
    },

    services: [{ type: Schema.ObjectId, ref: "Service", required: false }],

    service_area: { type: Array, required: false },

    team: [{ type: Schema.ObjectId, ref: "User", required: false }],

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

      coordinates: { type: Array, required: true },
    },

    billing_address: {
      street: { type: String, required: true },

      postal_code: { type: String, required: true },

      state: { type: String, required: false },

      city: { type: String, required: true },

      country: {
        type: String,
        required: true,
        enum: ["PT", "ES", "US", "UK"],
      },

      coordinates: { type: Array, required: true },
    },

    /**
     *   contactInformation: {
      owner: { type: Schema.ObjectId, ref: "user", required: false },
    },
     */

    legal_information: {
      // The legal name of the company
      business_name: { type: String, required: true },

      // NIPC in Portugal, NIF in Spain, in USA it's the SSN, IN UK it's the VAT number, etc
      tax_number: { type: String, required: true },

      // Business legal structure should be written on the company's country language
      business_structure: { type: String, required: true },
    },

    stripe_information: {
      /**
       *  The stripe connected account id
       * This is the id of the connected account that will be used for transfers to the company.
       */
      account_id: { type: String, required: true, unique: true },

      /**
       * The stripe customer id
       * This is the id of the customer that will be used for payments to the company (eg. Plan Payment).
       */
      customer_id: { type: String, required: true, unique: true },
    },

    is_active: { type: Boolean, required: true, default: true },

    created_at: { type: Date, required: true, default: Date.now() },

    updated_at: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);

/**
 * @TODO Methods that checks if the company provides services in a specific area given a lat and lng of an address. The method uses the serviceArea array of the company to create a polygon and then checks if the given point is inside the polygon.
 * @param {*} lat
 * @param {*} lng
 * @returns
 */
companySchema.methods.providesServicesInArea = function (lat, lng) {
  // Create an array of coordinates from the serviceArea array
  const coordinates = this.serviceArea.map((point) => {
    return [point.lng, point.lat];
  });

  const polygon = new Polygon(coordinates);

  //

  // Check if the given point is inside the polygon
  return polygon.containsPoint([lng, lat]);
};

export default companySchema;
