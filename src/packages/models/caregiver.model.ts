// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICaregiverDocument } from '../interfaces';

const CaregiverSchema: Schema<ICaregiverDocument> = new Schema<ICaregiverDocument>(
  {
    _id: Types.ObjectId,

    name: { type: String, required: true },

    /**
     * When creating a caregiver the health unit can decide to allow or not allow the caregiver access to the app.
     *
     * In the case the caregiver is allowed to the app a cognito_id is created for the caregiver.
     *
     * When searching for the health units caregivers the query is made by the health unit id so there is no need to make the email and phone unique.
     *
     * When a caregiver logs in the retrieve account request is mabe by the cognito_id.
     *
     * In the Business app caregivers are not allowed to signup themselves, to have an account they need to be created by the health unit.
     * The problem with this is that if the Health Unit A creates a caregiver with access to the app with the email
     * "example@healthunitB.com" then the Health Unit B couldn't create a caregiver with the email "example@healthunitB.com" because the email in cognito is unique. This only applies when creating caregivers with access to the app.
     *
     * To prevent this when creating caregivers with access to the app a verification must be done to only allow health units to create caregivers with an email that has the same domain as the health unit email domain.
     *
     * When a caregiver is created with access to the app the email and phone number are managed through cognito and because of this they are not required.
     * The email and phone number are only required when the caregiver is not allowed to the app.
     */
    email: { type: String },

    phone: { type: String },

    birthdate: { type: Date, required: true },

    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },

    /**
     * At the moment a caregiver can only be created by a health unit.
     * In the future a caregiver will be able to be created by a health unit or to signup himself to the app so the health unit will not be required.
     */
    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit' },

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
