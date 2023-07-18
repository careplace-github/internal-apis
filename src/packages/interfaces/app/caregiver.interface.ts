// mongoose
// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, IService, ISettings } from 'src/packages/interfaces';
// types
import { TGender, TCaregiverPermission, TBusinessRole } from 'src/packages/interfaces/types';

interface ICaregiver {
  _id: Types.ObjectId | string;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: TGender;
  health_unit: Types.ObjectId | IHealthUnit;
  address: IAddress;
  role: Exclude<TBusinessRole, 'technical_direction' | 'social_worker' | 'hr'>;
  permissions: TCaregiverPermission[];
  settings: ISettings;
  profile_picture?: string;
  services: Types.ObjectId[] | IService[];
}
type ICaregiverDocument = ICaregiver & Document;

export { ICaregiver, ICaregiverDocument };


