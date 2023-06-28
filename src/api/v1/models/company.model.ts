// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICompany } from '../interfaces';

const companySchema: Schema<ICompany> = new Schema<ICompany>(
  {
    _id: Schema.Types.ObjectId,

    business_profile: {
      name: { type: String, required: true, unique: true },
      about: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true, unique: true },
      website: { type: String, required: true, unique: true },
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

    addresses: {
      type: [
        {
          street: { type: String, required: true },
          postal_code: { type: String, required: true },
          state: { type: String, required: false },
          city: { type: String, required: true },
          country: { type: String, required: true },
          coordinates: { type: Array, required: true, default: [0, 0] },
        },
      ],
      required: true,
    },

    rating: {
      average: { type: Number, required: true, default: 0.0 },
      count: { type: Number, required: true, default: 0.0 },
      count_stars: {
        1: { type: Number, required: true, default: 0.0 },
        2: { type: Number, required: true, default: 0.0 },
        3: { type: Number, required: true, default: 0.0 },
        4: { type: Number, required: true, default: 0.0 },
        5: { type: Number, required: true, default: 0.0 },
      },
    },

    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: false }],

    service_area: {
      type: {
        type: String,
        enum: ['MultiPolygon'],
        required: true,
        default: 'MultiPolygon',
      },
      coordinates: {
        type: [[[[Number]]]], // Specify the schema of the coordinates field
      },
    },

    pricing: {
      average_hourly_rate: { type: Number, required: false, default: 0 },
      minimum_hourly_rate: { type: Number, required: true, default: 0 },
    },

    team: [{ type: Schema.Types.ObjectId, ref: 'crm_users', required: false }],

    stripe_information: {
      account_id: { type: String, required: true, unique: true },
      customer_id: { type: String, required: true, unique: true },
    },

    legal_information: {
      name: { type: String, required: true },
      director: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        birthdate: { type: Date, required: true },
      },
      tax_number: { type: String, required: true },
      business_structure: { type: String, required: true },
      address: {
        street: { type: String, required: true },
        postal_code: { type: String, required: true },
        state: { type: String, required: false },
        city: { type: String, required: true },
        country: {
          type: String,
          required: true,
          enum: ['PT', 'ES', 'US', 'UK'],
        },
        coordinates: { type: Array, required: true },
      },
    },

    is_active: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const CompanyModel: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);

export default CompanyModel;

export { companySchema };
