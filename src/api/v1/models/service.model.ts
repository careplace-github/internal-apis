// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IServiceModel } from '../interfaces';

const ServiceSchema: Schema<IServiceModel> = new Schema<IServiceModel>(
  {
    _id: Types.ObjectId,
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true, default: '' },
    short_description: { type: String, required: true, default: '' },
    image: { type: String, required: true, default: '' },
    icon: { type: String, required: false },
    type: { type: String, required: true, enum: ['special', 'normal'], default: 'normal' },
  },
  {
    timestamps: true, // createdAt, updatedAt
    virtuals: true, // enable virtuals
    toJSON: { virtuals: true }, // enable virtuals for the document in JSON format
    toObject: { virtuals: true }, // enable virtuals for the document in Object format
  }
);

const ServiceModel: Model<IServiceModel> = mongoose.model<IServiceModel>('Service', ServiceSchema);

export { ServiceSchema, ServiceModel };
