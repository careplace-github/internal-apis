import mongoose from "mongoose";
import GeometryUtils from "../../utils/data/geometry.utils.js";
import { ObjectId } from "mongodb";
import GeoJSON from "mongoose-geojson-schema";

const Schema = mongoose.Schema;

let Company;

const companySchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    business_profile: {
      name: { type: String, required: true, unique: true },

      about: { type: String, required: true },

      email: { type: String, required: true, unique: true },

      phone: { type: String, required: true, unique: true },

      website: { type: String, required: true, unique: true, default: "https://www.careplace.pt" },

      logo: { type: String, required: true },

      banner: { type: String, required: false },

      social_links: {
        facebook: { type: String, required: false },
        instagram: { type: String, required: false },
        twitter: { type: String, required: false },
        linkedin: { type: String, required: false },
        youtube: { type: String, required: false },
      },
    },

    rating: {
      average: { type: Number, required: true, default: 0 },

      count: { type: Number, required: false, default: 0 },
    },

    services: [{ type: Schema.ObjectId, ref: "Service", required: false }],

    serviceArea: {
      type: Schema.Types.MultiPolygon,
      required: true,
    },

    average_hourly_rate: { type: Number, required: true },

    team: [{ type: Schema.ObjectId, ref: "crm_users", required: false }],

    legal_information: {
      // The legal name of the company
      name: { type: String, required: true },

      director: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        birthdate: { type: Date, required: true },
      },

      // NIPC in Portugal, NIF in Spain, in USA it's the SSN, IN UK it's the VAT number, etc
      tax_number: { type: String, required: true },

      // Business legal structure should be written on the company's country language
      business_structure: { type: String, required: true },

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

    is_active: { type: Boolean, required: true, default: false },
  },

  {
    timestamps: true,
  }
);

/**
 * 'The first argument is the singular name of the collection your model is for. Mongoose automatically looks for the plural, lowercased version of your model name. Thus, for the example above, the model Tank is for the tanks collection in the database.'
 * @see https://mongoosejs.com/docs/models.html#compiling
 */
export default Company = mongoose.model("Company", companySchema);
