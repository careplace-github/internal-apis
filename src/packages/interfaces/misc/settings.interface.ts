import { TCountry, TTheme } from 'src/packages/interfaces/types';

interface ISettings {
  theme: TTheme;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language?: TCountry;
}

export { ISettings };
