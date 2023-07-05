// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICollaboratorModel } from '../interfaces'; // Assuming you have the interface defined

const CollaboratorSchema: Schema<ICollaboratorModel> = new Schema<ICollaboratorModel>(
  {
    _id: Schema.Types.ObjectId,

    cognito_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
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
      default: ['app_user'],
      enum: [
        'app_user',
        'admin_edit_users_permissions',
        'admin_edit_healthUnit',
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
    profile_picture: { type: String, required: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const CollaboratorModel: Model<ICollaboratorModel> = mongoose.model<ICollaboratorModel>(
  'Collaborator',
  CollaboratorSchema
);

export { CollaboratorSchema, CollaboratorModel };
