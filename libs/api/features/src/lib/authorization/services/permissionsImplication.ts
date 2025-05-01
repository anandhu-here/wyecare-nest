// permissionImplicationsData.ts
export const permissionImplicationsData = [
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'manage_permissions',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'manage_roles',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'view_all_organizations',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'manage_all_organizations',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'view_all_users',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'manage_all_users',
  },
  {
    parentPermissionId: 'manage_system',
    childPermissionId: 'create_system_admin',
  },
  {
    parentPermissionId: 'manage_all_organizations',
    childPermissionId: 'view_all_organizations',
  },
  {
    parentPermissionId: 'manage_all_organizations',
    childPermissionId: 'create_organization',
  },
  {
    parentPermissionId: 'manage_all_organizations',
    childPermissionId: 'delete_organization',
  },
  {
    parentPermissionId: 'manage_all_users',
    childPermissionId: 'view_all_users',
  },
  {
    parentPermissionId: 'manage_permissions',
    childPermissionId: 'add_permission',
  },
  {
    parentPermissionId: 'manage_permissions',
    childPermissionId: 'remove_permission',
  },
  {
    parentPermissionId: 'manage_permissions',
    childPermissionId: 'get_permissions',
  },
  {
    parentPermissionId: 'edit_organization',
    childPermissionId: 'view_organization',
  },
  {
    parentPermissionId: 'edit_staff_role',
    childPermissionId: 'view_staff',
  },
  {
    parentPermissionId: 'edit_subjects',
    childPermissionId: 'view_subjects',
  },
  {
    parentPermissionId: 'edit_timesheets',
    childPermissionId: 'view_timesheets',
  },
  {
    parentPermissionId: 'approve_timesheets',
    childPermissionId: 'view_timesheets',
  },
  {
    parentPermissionId: 'reject_timesheets',
    childPermissionId: 'view_timesheets',
  },
  {
    parentPermissionId: 'edit_locations',
    childPermissionId: 'view_locations',
  },
  {
    parentPermissionId: 'edit_providers',
    childPermissionId: 'view_providers',
  },
  {
    parentPermissionId: 'edit_invoices',
    childPermissionId: 'view_invoices',
  },
  {
    parentPermissionId: 'edit_payments',
    childPermissionId: 'view_payments',
  },
  {
    parentPermissionId: 'edit_settings',
    childPermissionId: 'view_settings',
  },
  {
    parentPermissionId: 'edit_schedules',
    childPermissionId: 'view_schedules',
  },
  {
    parentPermissionId: 'create_tasks',
    childPermissionId: 'view_tasks',
  },
  {
    parentPermissionId: 'update_tasks',
    childPermissionId: 'view_tasks',
  },
  {
    parentPermissionId: 'delete_tasks',
    childPermissionId: 'view_tasks',
  },
  {
    parentPermissionId: 'view_all_tasks',
    childPermissionId: 'view_tasks',
  },
  {
    parentPermissionId: 'view_all_tasks',
    childPermissionId: 'view_active_tasks',
  },
  {
    parentPermissionId: 'view_all_tasks',
    childPermissionId: 'view_pending_tasks',
  },
  {
    parentPermissionId: 'view_all_tasks',
    childPermissionId: 'view_historical_tasks',
  },
  {
    parentPermissionId: 'view_all_tasks',
    childPermissionId: 'view_overdue_tasks',
  },
  {
    parentPermissionId: 'assign_task',
    childPermissionId: 'view_tasks',
  },
  {
    parentPermissionId: 'create_service_plans',
    childPermissionId: 'view_service_plans',
  },
  {
    parentPermissionId: 'update_service_plans',
    childPermissionId: 'view_service_plans',
  },
  {
    parentPermissionId: 'delete_service_plans',
    childPermissionId: 'view_service_plans',
  },
  {
    parentPermissionId: 'create_service_notes',
    childPermissionId: 'view_service_notes',
  },
  {
    parentPermissionId: 'update_service_notes',
    childPermissionId: 'view_service_notes',
  },
  {
    parentPermissionId: 'delete_service_notes',
    childPermissionId: 'view_service_notes',
  },
  {
    parentPermissionId: 'create_health_records',
    childPermissionId: 'view_health_records',
  },
  {
    parentPermissionId: 'update_health_records',
    childPermissionId: 'view_health_records',
  },
  {
    parentPermissionId: 'delete_health_records',
    childPermissionId: 'view_health_records',
  },
  {
    parentPermissionId: 'create_medications',
    childPermissionId: 'view_medications',
  },
  {
    parentPermissionId: 'update_medications',
    childPermissionId: 'view_medications',
  },
  {
    parentPermissionId: 'delete_medications',
    childPermissionId: 'view_medications',
  },
  {
    parentPermissionId: 'create_subject_data',
    childPermissionId: 'view_subjects',
  },
  {
    parentPermissionId: 'update_subject_data',
    childPermissionId: 'view_subjects',
  },
  {
    parentPermissionId: 'delete_subject_data',
    childPermissionId: 'view_subjects',
  },
  {
    parentPermissionId: 'create_shift',
    childPermissionId: 'view_shift',
  },
  {
    parentPermissionId: 'update_shift',
    childPermissionId: 'view_shift',
  },
  {
    parentPermissionId: 'delete_shift',
    childPermissionId: 'view_shift',
  },
  {
    parentPermissionId: 'assign_users',
    childPermissionId: 'view_shift',
  },
  {
    parentPermissionId: 'create_reports',
    childPermissionId: 'view_reports',
  },
  {
    parentPermissionId: 'edit_reports',
    childPermissionId: 'view_reports',
  },
  {
    parentPermissionId: 'delete_reports',
    childPermissionId: 'view_reports',
  },
  {
    parentPermissionId: 'edit_group',
    childPermissionId: 'view_group',
  },
  {
    parentPermissionId: 'add_group_member',
    childPermissionId: 'view_group',
  },
  {
    parentPermissionId: 'update_group',
    childPermissionId: 'view_group',
  },
  {
    parentPermissionId: 'delete_group',
    childPermissionId: 'view_group',
  },
  {
    parentPermissionId: 'manage_leave_requests',
    childPermissionId: 'view_leave_requests',
  },
  {
    parentPermissionId: 'view_all_leave_balances',
    childPermissionId: 'view_leave_balance',
  },
  {
    parentPermissionId: 'manage_leave_policy',
    childPermissionId: 'view_leave_policy',
  },
];
