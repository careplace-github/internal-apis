// mongoose
import mongoose, { Model, Schema, Types } from 'mongoose';
// interfaces
import { IService } from '../interfaces';

const serviceSchema: Schema<IService> = new Schema<IService>(
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

const ServiceModel: Model<IService> = mongoose.model<IService>('Service', serviceSchema);

export default ServiceModel;

export { serviceSchema };
