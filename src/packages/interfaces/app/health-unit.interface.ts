// mongoose
import { Types, Document } from 'mongoose';
// Interfaces
import {
  IAddress,
  IBillingAddress,
  ICaregiver,
  ICollaborator,
  IService,
} from 'src/packages/interfaces';
// Types
import { TCoordinates, THealthUnitType } from 'src/packages/interfaces/types';

interface IHealthUnit {
  _id: Types.ObjectId | string;

  /**
   *
   * - Agency / Empresa SAD
   * - Retirement Homes / Lares de Idosos
   * - Senior Residences / Residências Sénior
   */
  type: THealthUnitType;

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
    coordinates: TCoordinates[][][];
  };
  pricing: {
    average_hourly_rate?: number;
    minimum_hourly_rate: number;
  };
  legal_information: {
    name: string;
    director: {
      name: string;
      email: string;
      phone: string;
      birthdate: Date;
      address: IAddress;
      role?: string;
      gender: string;
      id_number: string;
      political_exposure?: boolean;
    };
    tax_number: string;
    business_structure: string;
    address: IAddress;
  };

  billing_addresses: IBillingAddress[];

  stripe_information: {
    account_id: string;
    customer_id: string;
  };
  is_active: boolean;
}

type IHealthUnitDocument = IHealthUnit & Document;

export { IHealthUnit, IHealthUnitDocument };
