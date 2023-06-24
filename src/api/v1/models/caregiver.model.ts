// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ICaregiver } from '../interfaces';

const caregiverSchema: Schema<ICaregiver> = new Schema<ICaregiver>(
  {
    _id: Types.ObjectId,

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    phone: { type: String, required: true, unique: true },

    birthdate: { type: Date, required: true },

    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },

    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },

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
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const CaregiverModel: Model<ICaregiver> = mongoose.model<ICaregiver>('Caregiver', caregiverSchema);

export default CaregiverModel;

export { caregiverSchema };
