// mongoose
// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, IService, ISettings } from 'src/packages/interfaces';
// types
import { TGender, TCaregiverPermission, TBusinessRole } from 'src/packages/interfaces/types';

interface IAd {
  _id: Types.ObjectId | string;
  // Can only be 1, 2, or 3
  // 1 = Essential Tier
  // 2 = Premium Tier
  // 3 = Elite Tier
  type: (1 | 2 | 3);
  health_unit: IHealthUnit;
  start_date: Date;
  end_date: Date;
}
type IAdDocument = IAd & Document;

export { IAd, IAdDocument };
