// mongoose
import mongoose, { CallbackError, Model, Schema, Types } from 'mongoose';
// interfaces
import { IHealthUnitDocument } from '../interfaces';

const HealthUnitSchema: Schema<IHealthUnitDocument> = new Schema<IHealthUnitDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    type: {
      type: String,
      enum: ['agency', 'retirement_home', 'senior_residence'],
      required: true,
    },

    business_profile: {
      name: { type: String, required: true, unique: true, sparse: true },
      email: { type: String, required: true, unique: true, sparse: true },
      phone: { type: String, required: true, unique: true, sparse: true },

      about: { type: String, required: false },
      website: { type: String, required: false, unique: true, sparse: true },
      logo: { type: String, required: true },
      banner: { type: String, required: false },
      social_links: {
        facebook: { type: String, required: false },
        instagram: { type: String, required: false },
        twitter: { type: String, required: false },
        linkedin: { type: String, required: false },
        youtube: { type: String, required: false },
      },
      address: {
        street: { type: String, required: false },
        postal_code: { type: String, required: false },
        state: { type: String, required: false },
        city: { type: String, required: false },
        country: {
          type: String,
          required: false,
        },
      },
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

    pricing: {
      average_hourly_rate: { type: Number, required: false, default: 0 },
      minimum_hourly_rate: { type: Number, required: false, default: 0 },
      average_monthly_rate: { type: Number, required: false, default: 0 },
      minimum_monthly_rate: { type: Number, required: false, default: 0 },
    },

    stripe_information: {
      account_id: { type: String, required: false, unique: true, sparse: true },
      customer_id: { type: String, required: false, unique: true, sparse: true },
    },

    legal_information: {
      name: { type: String, required: false },
      director: {
        stripe_id: { type: String, required: false },
        // the following fields are required for the director because of Stripe
        name: { type: String, required: false },
        email: { type: String, required: false },
        phone: { type: String, required: false },
        role: { type: String, required: false },
        birthdate: { type: Date, required: false },
        address: {
          street: { type: String, required: false },
          postal_code: { type: String, required: false },
          state: { type: String, required: false },
          city: { type: String, required: false },
          country: {
            type: String,
            required: false,
          },
        },

        id_number: { type: String, required: false },
        gender: { type: String, required: false },
        political_exposure: { type: Boolean, required: false },
      },
      tax_number: { type: String, required: false },
      business_structure: { type: String, required: false },
      address: {
        street: { type: String, required: false },
        postal_code: { type: String, required: false },
        state: { type: String, required: false },
        city: { type: String, required: false },
        country: {
          type: String,
          required: true,
        },
        coordinates: { type: Array, required: false },
      },
    },

    service_area: {
      type: {
        type: String,
        default: 'MultiPolygon', // set default to MultiPolygon
      },
      coordinates: {
        type: [[[[Number]]]], // Specify the schema of the coordinates field
      },
    },

    billing_addresses: [
      {
        primary: { type: Boolean, required: false },
        name: { type: String, required: false },
        phone: { type: String, required: false },
        email: { type: String, required: false },
        street: { type: String, required: true },
        postal_code: { type: String, required: true },
        state: { type: String, required: false },
        city: { type: String, required: true },
        country: {
          type: String,
          required: true,
        },
      },
    ],

    is_active: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

HealthUnitSchema.index(
  { service_area: '2dsphere' },
  {
    name: 'service_area_2dsphere_index',
    background: true,
    sparse: true,
  }
);

const HealthUnitModel: Model<IHealthUnitDocument> = mongoose.model<IHealthUnitDocument>(
  'HealthUnit',
  HealthUnitSchema
);

HealthUnitModel.createIndexes((err: CallbackError) => {
  if (err) {
    console.error(err);
  }
});

export { HealthUnitSchema, HealthUnitModel };
