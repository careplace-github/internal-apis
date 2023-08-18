// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICollaboratorDocument } from '../interfaces'; // Assuming you have the interface defined

const CollaboratorSchema: Schema<ICollaboratorDocument> = new Schema<ICollaboratorDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    cognito_id: { type: String, required: false, unique: true },
    name: { type: String, required: true },

    /**
     * When creating a collaborator the health unit can decide to allow or not allow the collaborator access to the app.
     *
     * In the case the collaborator is allowed to the app a cognito_id is created for the collaborator.
     *
     * When searching for the health units collaborators the query is made by the health unit id so there is no need to make the email and phone unique.
     *
     * When a collaborator logs in the retrieve account request is mabe by the cognito_id.
     *
     * In the Business app collaborators are not allowed to signup themselves, to have an account they need to be created by the health unit.
     * The problem with this is that if the Health Unit A creates a collaborator with access to the app with the email
     * "example@healthunitB.com" then the Health Unit B couldn't create a collaborator with the email "example@healthunitB.com" because the email in cognito is unique. This only applies when creating collaborators with access to the app.
     *
     * To prevent this when creating collaborators with access to the app a verification must be done to only allow health units to create collaborators with an email that has the same domain as the health unit email domain.
     *
     *
     * When a Collaborator is created with access to the app the email and phone number are managed through cognito and because of this they are not required.
     * The email and phone number are only required when the collaborator is not allowed to the app.
     */
    email: { type: String },
    phone: { type: String },
    birthdate: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    health_unit: { type: Schema.Types.ObjectId, ref: 'healthUnit', required: true },
    address: {
      street: { type: String, required: false },
      postal_code: { type: String, required: false },
      state: { type: String, required: false },
      city: { type: String, required: false },
      country: { type: String, required: false },
      coordinates: {
        latitude: { type: Number, required: false },
        longitude: { type: Number, required: false },
      },
    },
    role: {
      type: String,
      required: true,
      enum: ['technical_direction', 'social_worker', 'hr'],
    },
    permissions: {
      type: [String],
      required: true,
      enum: [
        'app_user',
        'admin_edit_users_permissions',
        'admin_edit_health_unit',
        'dashboard_view',
        'calendar_view',
        'calendar_edit',
        'orders_view',
        'orders_edit',
        'orders_emails',
        'users_view',
        'users_edit',
      ],
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
        push: { type: Boolean, required: true, default: true },
        sms: { type: Boolean, required: true, default: true },
      },
    },
    profile_picture: { type: String, required: false, default: '' },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const CollaboratorModel: Model<ICollaboratorDocument> = mongoose.model<ICollaboratorDocument>(
  'Collaborator',
  CollaboratorSchema
);

export { CollaboratorSchema, CollaboratorModel };
