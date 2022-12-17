import mongoose from "mongoose";

const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String, required: true, unique: true },

    logo: { type: Schema.ObjectId, ref: "file", required: false },

    banner: { type: Schema.ObjectId, ref: "file", required: false },

    contactInformation: {
      owner: { type: Schema.ObjectId, ref: "user", required: false },

      phoneNumber: { type: String, required: true, unique: true },

      email: { type: String, required: true, unique: true },

      website: { type: String, required: false, unique: true },
    },

    team: [{ type: Schema.ObjectId, ref: "user", required: false }],

    services: [{ type: Schema.ObjectId, ref: "service", required: false }],

    address: {
      street: { type: String, required: true },

      postalCode: { type: String, required: true },

      state: { type: String, required: false },

      city: { type: String, required: true },

      country: { type: String, required: true },

      countryId: { type: String, required: true },

      fullAddress: { type: String, required: true },

      coordinates: { type: Array, required: true },
    },

    legalInformation: {
      // The legal name of the company
      businessName: { type: String, required: true },

      // NIPC in Portugal, NIF in Spain, in USA it's the SSN, IN UK it's the VAT number, etc
      taxId: { type: String, required: false },

      // LLC, S Corp, C Corp, Sole Proprietorship, Partnership, Nonprofit
      businessStructure: { type: String, required: true },

      // VAT number that should be used in invoices
      vatNumber: { type: String, required: true },
    },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);

export default companySchema;
