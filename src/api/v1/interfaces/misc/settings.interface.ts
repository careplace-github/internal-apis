import { Coordinates, Country, Theme } from '../../types';

export default interface ISettings {
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language?: Country;
}
