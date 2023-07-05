import { Coordinates, Country } from '../types';

interface IAddress {
  street: string;
  postal_code: string;
  city: string;
  state: string;
  country: Country;
  coordinates: Coordinates;
}

export { IAddress };
