import { MenuConfiguration } from '../types/layout-menu.interface';
import { OrganizationCategory } from '../types/organization.interface';

/**
 * Default menu configuration
 * This defines the entire application menu structure
 */
export const menuConfig: MenuConfiguration = {
  sections: [
    // Dashboard Section
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      order: 10,
      organizationCategories: ['*'],
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: 'home',
          path: '/dashboard',
          requiredPermissions: ['view_dashboard'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: 'chart-bar',
          path: '/dashboard/analytics',
          requiredPermissions: ['view_dashboard'],
          organizationCategories: ['*'],
          order: 20,
        },
      ],
    },

    // Subject Management Section
    {
      id: 'subject_management',
      label: 'Subject Management',
      icon: 'users',
      order: 20,
      organizationCategories: ['*'],
      categoryLabels: {
        [OrganizationCategory.HOSPITAL]: 'Patient Management',
        [OrganizationCategory.CARE_HOME]: 'Resident Management',
        [OrganizationCategory.EDUCATION]: 'Student Management',
        [OrganizationCategory.RETAIL]: 'Customer Management',
        [OrganizationCategory.SERVICE_PROVIDER]: 'Client Management',
      },
      items: [
        {
          id: 'subject_list',
          label: 'All Subjects',
          icon: 'list',
          path: '/dashboard/subjects',
          requiredPermissions: ['view_subjects'],
          organizationCategories: ['*'],
          categoryLabels: {
            [OrganizationCategory.HOSPITAL]: 'All Patients',
            [OrganizationCategory.CARE_HOME]: 'All Residents',
            [OrganizationCategory.EDUCATION]: 'All Students',
            [OrganizationCategory.RETAIL]: 'All Customers',
            [OrganizationCategory.SERVICE_PROVIDER]: 'All Clients',
          },
          order: 10,
        },
        {
          id: 'subject_add',
          label: 'Add Subject',
          icon: 'user-plus',
          path: '/dashboard/subjects/add',
          requiredPermissions: ['edit_subjects'],
          organizationCategories: ['*'],
          categoryLabels: {
            [OrganizationCategory.HOSPITAL]: 'Add Patient',
            [OrganizationCategory.CARE_HOME]: 'Add Resident',
            [OrganizationCategory.EDUCATION]: 'Add Student',
            [OrganizationCategory.RETAIL]: 'Add Customer',
            [OrganizationCategory.SERVICE_PROVIDER]: 'Add Client',
          },
          order: 20,
        },
        {
          id: 'subject_groups',
          label: 'Subject Groups',
          icon: 'users-group',
          path: '/dashboard/subjects/groups',
          requiredPermissions: ['view_group'],
          organizationCategories: ['*'],
          categoryLabels: {
            [OrganizationCategory.HOSPITAL]: 'Patient Groups',
            [OrganizationCategory.CARE_HOME]: 'Resident Groups',
            [OrganizationCategory.EDUCATION]: 'Student Groups',
            [OrganizationCategory.RETAIL]: 'Customer Groups',
            [OrganizationCategory.SERVICE_PROVIDER]: 'Client Groups',
          },
          order: 30,
        },
      ],
    },

    // Healthcare-Specific Sections
    {
      id: 'health_records',
      label: 'Health Records',
      icon: 'file-medical',
      order: 30,
      organizationCategories: [
        OrganizationCategory.HOSPITAL,
        OrganizationCategory.CARE_HOME,
        OrganizationCategory.HEALTHCARE,
      ],
      items: [
        {
          id: 'health_records_list',
          label: 'All Records',
          icon: 'clipboard-list',
          path: '/dashboard/health-records',
          requiredPermissions: ['view_health_records'],
          organizationCategories: [
            OrganizationCategory.HOSPITAL,
            OrganizationCategory.CARE_HOME,
            OrganizationCategory.HEALTHCARE,
          ],
          order: 10,
        },
        {
          id: 'medications',
          label: 'Medications',
          icon: 'pills',
          path: '/dashboard/medications',
          requiredPermissions: ['view_medications'],
          organizationCategories: [
            OrganizationCategory.HOSPITAL,
            OrganizationCategory.CARE_HOME,
            OrganizationCategory.HEALTHCARE,
          ],
          order: 20,
        },
      ],
    },

    // Staff Management Section
    {
      id: 'staff_management',
      label: 'Staff Management',
      icon: 'user-tie',
      order: 40,
      organizationCategories: ['*'],
      items: [
        {
          id: 'staff_list',
          label: 'All Staff',
          icon: 'users',
          path: '/dashboard/staff',
          requiredPermissions: ['view_staff'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'invite_staff',
          label: 'Invite Staff',
          icon: 'user-plus',
          path: '/dashboard/staff/invite',
          requiredPermissions: ['invite_staff'],
          organizationCategories: ['*'],
          order: 20,
        },
        {
          id: 'staff_roles',
          label: 'Staff Roles',
          icon: 'shield',
          path: '/dashboard/staff/roles',
          requiredPermissions: ['edit_staff_role'],
          organizationCategories: ['*'],
          order: 30,
        },
      ],
    },

    // Schedule Management Section
    {
      id: 'schedule_management',
      label: 'Scheduling',
      icon: 'calendar',
      order: 50,
      organizationCategories: ['*'],
      items: [
        {
          id: 'calendar',
          label: 'Calendar',
          icon: 'calendar-days',
          path: '/dashboard/schedule/calendar',
          requiredPermissions: ['view_schedules'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'shifts',
          label: 'Shifts',
          icon: 'clock',
          path: '/dashboard/schedule/shifts',
          requiredPermissions: ['view_shift'],
          organizationCategories: ['*'],
          order: 20,
        },
        {
          id: 'leave_requests',
          label: 'Leave Requests',
          icon: 'calendar-minus',
          path: '/dashboard/schedule/leave',
          requiredPermissions: ['view_leave_requests'],
          organizationCategories: ['*'],
          order: 30,
        },
      ],
    },

    // Inventory Management Section (for retail, hospitality, etc.)
    {
      id: 'inventory_management',
      label: 'Inventory',
      icon: 'boxes',
      order: 60,
      organizationCategories: [
        OrganizationCategory.RETAIL,
        OrganizationCategory.HOSPITALITY,
        OrganizationCategory.MANUFACTURING,
        OrganizationCategory.LOGISTICS,
      ],
      items: [
        {
          id: 'inventory_list',
          label: 'All Items',
          icon: 'box',
          path: '/dashboard/inventory',
          requiredPermissions: ['view_inventory'],
          organizationCategories: [
            OrganizationCategory.RETAIL,
            OrganizationCategory.HOSPITALITY,
            OrganizationCategory.MANUFACTURING,
            OrganizationCategory.LOGISTICS,
          ],
          order: 10,
        },
        {
          id: 'suppliers',
          label: 'Suppliers',
          icon: 'truck',
          path: '/dashboard/inventory/suppliers',
          requiredPermissions: ['view_supplier_contracts'],
          organizationCategories: [
            OrganizationCategory.RETAIL,
            OrganizationCategory.HOSPITALITY,
            OrganizationCategory.MANUFACTURING,
            OrganizationCategory.LOGISTICS,
          ],
          order: 20,
        },
      ],
    },

    // Finance Section
    {
      id: 'finance',
      label: 'Finance',
      icon: 'money-bill',
      order: 70,
      organizationCategories: ['*'],
      items: [
        {
          id: 'invoices',
          label: 'Invoices',
          icon: 'file-invoice',
          path: '/dashboard/finance/invoices',
          requiredPermissions: ['view_invoices'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'payments',
          label: 'Payments',
          icon: 'credit-card',
          path: '/dashboard/finance/payments',
          requiredPermissions: ['view_payments'],
          organizationCategories: ['*'],
          order: 20,
        },
        {
          id: 'payroll',
          label: 'Payroll',
          icon: 'money-check',
          path: '/dashboard/finance/payroll',
          requiredPermissions: ['view_payroll'],
          organizationCategories: ['*'],
          order: 30,
        },
      ],
    },

    // Tasks Section
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'tasks',
      order: 80,
      organizationCategories: ['*'],
      items: [
        {
          id: 'my_tasks',
          label: 'My Tasks',
          icon: 'check-square',
          path: '/dashboard/tasks/my',
          requiredPermissions: ['view_tasks'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'all_tasks',
          label: 'All Tasks',
          icon: 'list-check',
          path: '/dashboard/tasks/all',
          requiredPermissions: ['view_all_tasks'],
          organizationCategories: ['*'],
          order: 20,
        },
        {
          id: 'task_templates',
          label: 'Task Templates',
          icon: 'clipboard',
          path: '/dashboard/tasks/templates',
          requiredPermissions: ['view_task_templates'],
          organizationCategories: ['*'],
          order: 30,
        },
      ],
    },

    // Reports Section
    {
      id: 'reports',
      label: 'Reports',
      icon: 'chart-line',
      order: 90,
      organizationCategories: ['*'],
      items: [
        {
          id: 'standard_reports',
          label: 'Standard Reports',
          icon: 'file-chart-line',
          path: '/dashboard/reports/standard',
          requiredPermissions: ['view_reports'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'custom_reports',
          label: 'Custom Reports',
          icon: 'file-chart-pie',
          path: '/dashboard/reports/custom',
          requiredPermissions: ['create_reports'],
          organizationCategories: ['*'],
          order: 20,
        },
      ],
    },

    // Settings Section
    {
      id: 'settings',
      label: 'Settings',
      icon: 'cog',
      order: 100,
      organizationCategories: ['*'],
      items: [
        {
          id: 'organization_settings',
          label: 'Organization',
          icon: 'building',
          path: '/dashboard/settings/organization',
          requiredPermissions: ['view_organization'],
          organizationCategories: ['*'],
          order: 10,
        },
        {
          id: 'user_settings',
          label: 'User Settings',
          icon: 'user-cog',
          path: '/dashboard/settings/user',
          requiredPermissions: [], // No special permission needed for user's own settings
          organizationCategories: ['*'],
          order: 20,
        },
        {
          id: 'permissions_settings',
          label: 'Permissions',
          icon: 'shield-alt',
          path: '/dashboard/settings/permissions',
          requiredPermissions: ['edit_staff_role'],
          organizationCategories: ['*'],
          order: 30,
        },
        {
          id: 'notification_settings',
          label: 'Notifications',
          icon: 'bell',
          path: '/dashboard/settings/notifications',
          requiredPermissions: ['view_settings'],
          organizationCategories: ['*'],
          order: 40,
        },
      ],
    },
  ],
};

export default menuConfig;
