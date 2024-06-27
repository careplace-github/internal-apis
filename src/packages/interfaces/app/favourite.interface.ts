// mongoose
// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IHealthUnit, ICustomer } from 'src/packages/interfaces';

interface IFavourite {
  _id: Types.ObjectId | string;
  health_unit: IHealthUnit;
  customer: ICustomer;
}
type IFavouriteDocument = IFavourite & Document;

export { IFavourite, IFavouriteDocument };
