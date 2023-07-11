import { TCoordinates, TCountry } from 'src/api/v1/interfaces/types';

interface IAddress {
  street: string;
  postal_code: string;
  city: string;
  state: string;
  country: TCountry;
  coordinates: TCoordinates;
}

export { IAddress };
