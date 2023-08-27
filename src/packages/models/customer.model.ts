// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICustomerDocument } from '../interfaces';

const CustomerSchema: Schema<ICustomerDocument> = new Schema<ICustomerDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    cognito_id: { type: String, unique: true },
    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: false },
    name: { type: String, required: true },
    /**
     * Health units may create customers to for the orders of "offline" customers.
     * Different health units may have orders with the same customer.
     * Because of this the email and phone are not unique.
     * When searching for the health units customers the query is made by the health unit id so there is no need to make the email and phone unique.
     *
     * This model is also used for Marketplace Users.
     * When a user logs in the retrieve account request is mabe by the cognito_id.
     * So even if a health unit creates a customer with the email "example@domain.com" and then a user with the same email
     * creates an account in the marketplace, there will be no conflicts (because the query for the health unit customers is made by the health unit id and the query for the marketplace users is made by the cognito_id).
     *
     *
     * When a Customer is created with access to the app the email and phone number are managed through cognito and because of this they are not required.
     * The email and phone number are only required when the Customer is not allowed to the app.
     */

    /**
     * Even though the email and phone are managed by cognito, they are still stored in the database because this information is needed to be shown on the orders for the health units.
     */
    email: { type: String, required: true },
    phone: { type: String, required: true },
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
        default: 'PT',
      },
      coordinates: { type: Array, required: false },
    },
    stripe_information: {
      customer_id: { type: String, required: false },
    },
    permissions: {
      type: [String],
      required: true,
      default: ['app_user'],
      enum: [],
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

const CustomerModel: Model<ICustomerDocument> = mongoose.model<ICustomerDocument>(
  'Customer',
  CustomerSchema
);

export { CustomerSchema, CustomerModel };
