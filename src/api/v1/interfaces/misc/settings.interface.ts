import { Coordinates, Country, Theme } from '../types';

interface ISettings {
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language?: Country;
}

export { ISettings };
