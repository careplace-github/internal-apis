import { Types } from 'mongoose';

export default interface ICompany {
  _id: Types.ObjectId;
  business_profile: {
    name: string;
    about: string;
    email: string;
    phone: string;
    website: string;
    logo: string;
    banner: string;
    social_links: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
      youtube: string;
    };
  };

  addresses: [
    {
      street: string;
      postal_code: string;
      state?: string;
      city: string;
      country: string;
      coordinates: number[];
    }
  ];
  rating: {
    average: number;
    count: number;
  };
  services: Types.ObjectId[];
  service_area: {
    type: string;
    coordinates: number[][][];
  };
  average_hourly_rate: number;
  team: Types.ObjectId[];
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
    address: {
      street: string;
      postal_code: string;
      state: string;
      city: string;
      country: string;
      coordinates: number[];
    };
  };
  stripe_information: {
    account_id: string;
    customer_id: string;
  };
  is_active: boolean;

  // timestamps
  createdAt: Date;
  updatedAt: Date;
}
