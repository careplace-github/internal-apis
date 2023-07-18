// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IPatientDocument } from '../interfaces';

const PatientSchema: Schema<IPatientDocument> = new Schema<IPatientDocument>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'customer', required: false },
    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: false },

    kinship: {
      type: String,
      required: true,
      enum: [
        'father',
        'mother',
        'grandfather',
        'grandmother',
        'greatGrandFather',
        'greatGrandMother',
        'uncle',
        'aunt',
        'son',
        'daughter',
        'brother',
        'sister',
        'other',
      ],
    },
    profile_picture: { type: String, required: false },
    name: { type: String, required: true },
    birthdate: { type: Date, required: true },
    phone: { type: String, required: false },
    gender: { type: String, required: false, enum: ['male', 'female', 'other'] },
    medical_conditions: { type: String, required: false },
    address: {
      street: { type: String, required: true },
      postal_code: { type: String, required: true },
      state: { type: String, required: false },
      city: { type: String, required: true },
      country: { type: String, required: true, enum: ['PT', 'ES', 'US', 'UK'] },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const PatientModel: Model<IPatientDocument> = mongoose.model<IPatientDocument>('Patient', PatientSchema);

export { PatientSchema, PatientModel };
