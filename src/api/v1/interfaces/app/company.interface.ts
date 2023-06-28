// mongoose
import { Types, Document } from 'mongoose';
// Interfaces
import { IAddress, ICaregiver, ICRMUser, IService } from '../';
// Types
import { Coordinates } from '../../types';

export default interface ICompany extends Document {
  _id: Types.ObjectId | string;
  business_profile: {
    name: string;
    about: string;
    email: string;
    phone: string;
    website: string;
    logo: string;
    banner: string;
    social_links: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
  };

  addresses: IAddress[];
  rating: {
    average: number;
    count: number;
    count_stars: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };

  services: Types.ObjectId[] | IService[];
  service_area: {
    type: string;
    coordinates: Coordinates[][][];
  };
  pricing: {
    average_hourly_rate?: number;
    minimum_hourly_rate: number;
  };
  team: Types.ObjectId[] | (ICaregiver | ICRMUser)[];
  legal_information: {
    name: string;
    director: {
      name: string;
      email: string;
      phone: string;
      birthdate: Date;
    };
    tax_number: string;
    business_structure: string;
    address: IAddress;
  };
  stripe_information: {
    account_id: string;
    customer_id: string;
  };
  is_active: boolean;
}
