// mongoose
import { Document, Types } from 'mongoose';

interface IService {
  _id: Types.ObjectId;
  type: string;
  name: string;
  short_description: string;
  description: string;
  image?: string;
  icon?: string;
}

type IServiceModel = IService & Document;

export { IService, IServiceModel };
