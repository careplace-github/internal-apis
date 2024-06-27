// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IFavouriteDocument } from '../interfaces';

const FavouriteSchema: Schema<IFavouriteDocument> = new Schema<IFavouriteDocument>(
  {
    _id: Types.ObjectId,

    health_unit: { type: Schema.Types.ObjectId, ref: 'HealthUnit', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const FavouriteModel: Model<IFavouriteDocument> = mongoose.model<IFavouriteDocument>(
  'Favourite',
  FavouriteSchema
);

export { FavouriteSchema, FavouriteModel };
