type TTheme = 'light' | 'dark';

type TBusinessRole = 'technical_direction' | 'social_worker' | 'hr' | 'caregiver';

type TPermission =
  | 'app_user'
  | 'admin_edit_users_permissions'
  | 'admin_edit_healthUnit'
  | 'dashboard_view'
  | 'calendar_view'
  | 'calendar_edit'
  | 'orders_view'
  | 'orders_edit'
  | 'orders_emails'
  | 'users_view'
  | 'users_edit';

type TCollaboratorPermission = TPermission;

type TCaregiverPermission = TPermission;

type TCustomerPermission = Extract<TPermission, 'app_user'>;

export {
  TTheme,
  TBusinessRole,
  TCollaboratorPermission,
  TCaregiverPermission,
  TCustomerPermission,
};
