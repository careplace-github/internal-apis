type UserAttribute = {
  Name: string;
  Value: string;
};

type MFAOption = {
  AttributeName: string;
  DeliveryMedium: string;
};

type UserMFASetting = 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA';

export default interface ICognitoUser {
  MFAOptions: MFAOption[];
  PreferredMfaSetting: string;
  UserAttributes: UserAttribute[];
  UserMFASettingList: UserMFASetting[];
  Username: string;
}
