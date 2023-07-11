// mongoose
import { Types, Document } from 'mongoose';
// interfaces
import { IAddress, IHealthUnit, ISettings } from 'src/api/v1/interfaces';
// types
import { TGender, TCollaboratorPermission, TBusinessRole } from 'src/api/v1/interfaces/types';

interface ICollaborator {
  _id: Types.ObjectId | string;
  cognito_id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: Date;
  gender: TGender;
  health_unit: Types.ObjectId | IHealthUnit;
  address: IAddress;
  role: Exclude<TBusinessRole, 'caregiver'>;
  permissions: TCollaboratorPermission[];
  settings: ISettings;
  profile_picture?: string;
}
type ICollaboratorDocument = ICollaborator & Document;

export { ICollaborator, ICollaboratorDocument };
