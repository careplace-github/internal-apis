import { Coordinates, Country } from '../../types';

export default interface IAddress {
  street: string;
  postal_code: string;
  city: string;
  state: string;
  country: Country;
  coordinates: Coordinates;
}
