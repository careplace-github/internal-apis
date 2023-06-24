// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IMarketplaceUser } from '../interfaces';

const marketplaceUserSchema: Schema<IMarketplaceUser> = new Schema<IMarketplaceUser>(
  {
    _id: Schema.Types.ObjectId,
    cognito_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    birthdate: { type: Date, required: false },
    gender: {
      type: String,
      required: false,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: { type: String, required: false },
      postal_code: { type: String, required: false },
      state: { type: String, required: false },
      city: { type: String, required: false },
      country: {
        type: String,
        required: true,
        enum: ['PT'],
      },
      coordinates: { type: Array, required: false },
    },
    stripe_information: {
      customer_id: { type: String, required: false },
    },
    settings: {
      theme: {
        type: String,
        required: true,
        default: 'light',
        enum: ['light', 'dark'],
      },
      notifications: {
        email: { type: Boolean, required: true, default: true },
        sms: { type: Boolean, required: true, default: true },
        push: { type: Boolean, required: true, default: true },
      },
    },
    profile_picture: { type: String, required: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const MarketplaceUserModel: Model<IMarketplaceUser> = mongoose.model<IMarketplaceUser>(
  'marketplace_user',
  marketplaceUserSchema
);

export default MarketplaceUserModel;

export { marketplaceUserSchema };
