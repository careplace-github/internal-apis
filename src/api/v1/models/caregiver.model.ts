// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICaregiverDocument } from '../interfaces';

const CaregiverSchema: Schema<ICaregiverDocument> = new Schema<ICaregiverDocument>(
  {
    _id: Types.ObjectId,

    name: { type: String, required: true },

    cognito_id: { type: String, required: false, unique: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    birthdate: { type: Date, required: true },

    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },

    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: true },

    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: false }],

    address: {
      street: { type: String, required: false },

      postal_code: { type: String, required: false },

      state: { type: String, required: false },

      city: { type: String, required: false },

      country: {
        type: String,
        required: false,
      },

      coordinates: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
      },
    },

    role: {
      type: String,
      required: true,
      enum: ['caregiver'],
    },

    profile_picture: { type: String, required: false },

    settings: {
      theme: {
        type: String,
        required: true,
        default: 'light',
        enum: ['light', 'dark'],
      },
      notifications: {
        email: { type: Boolean, required: true, default: true },
        push: { type: Boolean, required: true, default: true },
        sms: { type: Boolean, required: true, default: true },
      },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const CaregiverModel: Model<ICaregiverDocument> = mongoose.model<ICaregiverDocument>(
  'Caregiver',
  CaregiverSchema
);

export { CaregiverSchema, CaregiverModel };
