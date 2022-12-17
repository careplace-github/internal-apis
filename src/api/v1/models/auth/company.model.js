import mongoose from "mongoose";

const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    name: { type: String, required: true, unique: true },

    photoURL: { type: String, required: false },

    contactInformation: {
      owner: { type: Schema.ObjectId, ref: "user", required: false },

      phoneNumber: { type: String, required: true, unique: false },

      email: { type: String, required: true, unique: true },

      website: { type: String, required: false, unique: true },
    },

    team: [{ type: Schema.ObjectId, ref: "user", required: false }],

    services : [{ type: Schema.ObjectId, ref: "service", required: false }],

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

        businessName: { type: String, required: true },

        businessType: { type: String, required: true },

        vatNumber: { type: String, required: false },

        taxId: { type: String, required: false },

        registrationNumber: { type: String, required: false },

        registrationUrl: { type: String, required: false },

        registrationAddress: { type: String, required: false },

        registrationCity: { type: String, required: false },

        registrationZip: { type: String, required: false },

        registrationCountry: { type: String, required: false },

        registrationState: { type: String, required: false },

        registrationDate: { type: Date, required: false },

      },

   

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);


export default companySchema;
