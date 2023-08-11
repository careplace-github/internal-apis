// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { ILeadDocument } from '../interfaces';

const LeadSchema: Schema<ILeadDocument> = new Schema<ILeadDocument>(
  {
    _id: Types.ObjectId,

    type: {
      type: String,
      required: true,
      enum: ['caregiver', 'health_unit', 'health_unit_newsletter', 'customer_newsletter'],
    },

    name: { type: String, required: false },
    email: { type: String, required: false, unique: true },
    phone: { type: String, required: false },
    company: { type: String, required: false },
    company_type: { type: String, required: false },
    company_size: { type: String, required: false },
    role: { type: String, required: false },
    message: { type: String, required: false },
  },

  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const LeadModel: Model<ILeadDocument> = mongoose.model<ILeadDocument>('Lead', LeadSchema);

export { LeadSchema, LeadModel };
