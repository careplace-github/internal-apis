import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const Schema = mongoose.Schema;

const companySchema = new Schema(
  {
    _id: Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true },

    logo: { type: String, required: false },

    banner: { type: String, required: false },

    isActive: { type: Boolean, required: true, default: true },

    contactInformation: {
      owner: { type: Schema.ObjectId, ref: "user", required: false },

      email: { type: String, required: true, unique: true },

      phoneNumberCountryCode: {
        type: String,
        required: true,
        enum: ["+351", "+34", "+1", "+44"],
      },

      // Verify if the phone number doesn't have any spaces and if doesn't have any special characters. If it does, remove them.
      phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
          if (value.includes(" ")) {
            // Remove all spaces from the phone number
            value = value.replace(/\s/g, "");
          } else if (value.startsWith(this.phoneNumberCountryCode)) {
            // Remove all the special characters from the phone number
            value = value.replace(/[^0-9]/g, "");
          }
        },
      },

      website: { type: String, required: false, unique: true },
    },

    team: [{ type: Schema.ObjectId, ref: "User", required: false }],

    services: [{ type: Schema.ObjectId, ref: "Service", required: false }],

    serviceArea: { type: Array, required: false },

    address: {
      street: { type: String, required: true },

      postalCode: { type: String, required: true },

      state: { type: String, required: false },

      city: { type: String, required: true },

      country: { type: String, required: true },

      countryId: {
        type: String,
        required: true,
        enum: ["PT", "ES", "US", "UK"],
      },

       // Check if full address is equal to street + postalCode + city + state + country
        // If it's not equal, add the missing information to the full address
        fullAddress: {
          type: String,
          required: true,
          validate(value) {
            if (
              value !==
              this.street +
                ", " +
                this.postalCode +
                ", " +
                this.city +
                ", " +
                this.state +
                ", " +
                this.country
            ) {
              value =
                this.street +
                ", " +
                this.postalCode +
                ", " +
                this.city +
                ", " +
                this.state +
                ", " +
                this.country;
            }
          },
        },

      coordinates: { type: Array, required: true },
    },

    legalInformation: {
      // The legal name of the company
      businessName: { type: String, required: true },

      // NIPC in Portugal, NIF in Spain, in USA it's the SSN, IN UK it's the VAT number, etc
      taxId: { type: String, required: true },

      // Business legal structure should be written on the company's country language
      businessStructure: { type: String, required: true },
    },

    paymentInformation: {

      // Name of the billing company  
      billingName: { type: String, required: true },

      // The bank account number
      bankAccountNumber: { type: String, required: true },

      // The bank account holder name
      bankAccountHolderName: { type: String, required: true },

      billingAddress: {
        street: { type: String, required: true },

        postalCode: { type: String, required: true },

        state: { type: String, required: false },

        city: { type: String, required: true },

        country: { type: String, required: true },

        countryId: {
          type: String,
          required: true,
          enum: ["PT", "ES", "US", "UK"],
        },

        // Check if full address is equal to street + postalCode + city + state + country
        // If it's not equal, add the missing information to the full address
        fullAddress: {
          type: String,
          required: true,
          validate(value) {
            if (
              value !==
              this.street +
                ", " +
                this.postalCode +
                ", " +
                this.city +
                ", " +
                this.state +
                ", " +
                this.country
            ) {
              value =
                this.street +
                ", " +
                this.postalCode +
                ", " +
                this.city +
                ", " +
                this.state +
                ", " +
                this.country;
            }
          },
        },

        coordinates: { type: Array, required: true },
      },

      cards: [
        {
          // Last 4 digits of the bank account number
          // Verify if is equal to 4
          cardLastDigits: {
            type: Number,
            required: true,
            validate(value) {
              if (value.toString().length !== 4) {
                throw new Error(
                  "Last 4 digits of the bank account number must be 4 digits"
                );
              }
            },
          },

          cardType: {
            type: String,
            required: true,
            enum: ["Visa", "Mastercard", "American Express", "Discover"],
          },
        },
      ],
    },

    // Membership plan
    plan: { type: String, required: true, enum: ["Free", "Premium"] },

    createdAt: { type: Date, required: true, default: Date.now() },

    updatedAt: { type: Date, required: true, default: Date.now() },
  },

  {
    timestamps: true,
  }
);

/**
 * @TODO Methods that checks if the company provides services in a specific area given a lat and lng of an address. The method uses the serviceArea array of the company to create a polygon and then checks if the given point is inside the polygon.
 * @param {*} lat
 * @param {*} lng
 * @returns
 */
companySchema.methods.providesServicesInArea = function (lat, lng) {
  // Create an array of coordinates from the serviceArea array
  const coordinates = this.serviceArea.map((point) => {
    return [point.lng, point.lat];
  });

  const polygon = new Polygon(coordinates);

  //

  // Check if the given point is inside the polygon
  return polygon.containsPoint([lng, lat]);
};

export default companySchema;
