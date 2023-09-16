import { IAddress } from './address.interface';

interface IBillingAddress extends IAddress {
  primary: boolean;
  name: string;
  phone: string;
  email: string;
}

export { IBillingAddress 
};
