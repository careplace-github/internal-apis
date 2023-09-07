import { TCoordinates, TCountry } from 'src/packages/interfaces/types';

interface IAddress {
  street: string;
  postal_code: string;
  city: string;
  state: string;
  country: TCountry;
  coordinates: TCoordinates;
}

export { IAddress };
