import { MenuConfiguration, OrganizationCategory } from "@wyecare-monorepo/web-ui";


/**
 * Menu configuration that defines the sidebar menu structure
 * This is a direct replacement for the calculateMenuItems function
 */
export const menuConfig: any = {
    sections: [
        // Common Section (items shown to all users)
        {
            id: 'common',
            label: 'Common',
            icon: 'material-symbols-light:home-outline',
            order: 10,
            organizationCategories: ['*'],
            items: [
                {
                    id: 'home',
                    label: 'Home',
                    icon: 'material-symbols-light:home-outline',
                    link: '/dashboard',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 10
                }
            ]
        },

        // Admin Section
        {
            id: 'admin',
            label: 'Administration',
            icon: 'mingcute:settings-3-fill',
            order: 20,
            organizationCategories: ['*'],
            items: [
                {
                    id: 'invitations',
                    label: 'Invitations',
                    icon: 'fluent:mail-20-regular',
                    link: '/dashboard/invitations',
                    requiredPermissions: ['invite_staff'],
                    organizationCategories: ['*'],
                    order: 10,
                    // Only show to admin and owner roles
                    roles: ['admin', 'owner']
                },
                {
                    id: 'invoices',
                    label: 'Invoices',
                    icon: 'fluent:document-20-regular',
                    link: '/dashboard/invoices',
                    requiredPermissions: ['view_invoices'],
                    organizationCategories: ['*'],
                    order: 20,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'settings',
                    label: 'Settings',
                    icon: 'mingcute:settings-3-fill',
                    link: '/dashboard/settings',
                    requiredPermissions: ['view_settings'],
                    organizationCategories: ['*'],
                    order: 30,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'leave-management',
                    label: 'Leave',
                    icon: 'fluent:calendar-20-regular',
                    link: '/dashboard/leave-management',
                    requiredPermissions: ['view_leave_requests'],
                    organizationCategories: ['*'],
                    order: 40,
                    roles: ['admin', 'owner']
                }
            ]
        },

        // Agency-specific items (for organizations with type=agency)
        {
            id: 'agency-items',
            label: 'Agency Management',
            icon: 'octicon:organization-24',
            order: 30,
            organizationCategories: [OrganizationCategory.SERVICE_PROVIDER],
            // Legacy support for type=agency
            legacyTypes: ['agency'],
            items: [
                {
                    id: 'timesheets',
                    label: 'Timesheets',
                    icon: 'hugeicons:google-sheet',
                    link: '/dashboard/org-timesheets',
                    requiredPermissions: ['view_timesheets'],
                    organizationCategories: [OrganizationCategory.SERVICE_PROVIDER],
                    order: 10,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'homes',
                    label: 'Homes',
                    icon: 'material-symbols-light:home-work',
                    link: '/dashboard/home-users',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.SERVICE_PROVIDER],
                    order: 20,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'staffs',
                    label: 'Staffs',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/staffs',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.SERVICE_PROVIDER],
                    order: 30,
                    roles: ['admin', 'owner']
                }
            ]
        },

        // Home-specific items (for organizations with type=home)
        {
            id: 'home-items',
            label: 'Home Management',
            icon: 'material-symbols-light:home-work',
            order: 30,
            organizationCategories: [OrganizationCategory.CARE_HOME],
            // Legacy support for type=home
            legacyTypes: ['home'],
            items: [
                {
                    id: 'residents',
                    label: 'Residents',
                    icon: 'healthicons:elderly-outline',
                    link: '/dashboard/residents',
                    requiredPermissions: ['view_subjects'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 10,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'timesheets',
                    label: 'Timesheets',
                    icon: 'hugeicons:google-sheet',
                    link: '/dashboard/org-timesheets',
                    requiredPermissions: ['view_timesheets'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 20,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'attendance',
                    label: 'Attendance',
                    icon: 'fluent:people-20-regular',
                    link: '/dashboard/attendance-registry',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 30,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'agencies',
                    label: 'Agencies',
                    icon: 'octicon:organization-24',
                    link: '/dashboard/agency-users',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 40,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'staffs',
                    label: 'Staffs',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/staffs',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 50,
                    roles: ['admin', 'owner']
                },
                {
                    id: 'third-parties',
                    label: 'Third Parties',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/home-thirdparties',
                    requiredPermissions: ['view_staff'],
                    organizationCategories: [OrganizationCategory.CARE_HOME],
                    order: 60,
                    roles: ['admin', 'owner'],
                    // Only show if feature flag is enabled
                    showIf: (settings: any) => settings?.allowResident3rdParty === true
                }
            ]
        },

        // Carer-specific items
        {
            id: 'carer-items',
            label: 'Carer',
            icon: 'fluent:scan-person-20-regular',
            order: 40,
            organizationCategories: ['*'],
            items: [
                {
                    id: 'timesheets',
                    label: 'Timesheets',
                    icon: 'hugeicons:google-sheet',
                    link: '/dashboard/staff-timesheets',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 10,
                    roles: ['carer']
                },
                {
                    id: 'leave',
                    label: 'Leave',
                    icon: 'fluent:calendar-20-regular',
                    link: '/dashboard/employee-leave',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 20,
                    roles: ['carer']
                },
                {
                    id: 'profile',
                    label: 'Profile',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/carer-profile',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 30,
                    roles: ['carer']
                }
            ]
        },

        // Nurse-specific items
        {
            id: 'nurse-items',
            label: 'Nurse',
            icon: 'fluent:scan-person-20-regular',
            order: 50,
            organizationCategories: ['*'],
            items: [
                {
                    id: 'profile',
                    label: 'Profile',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/nurse-profile',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 10,
                    roles: ['nurse']
                },
                {
                    id: 'timesheets',
                    label: 'Timesheets',
                    icon: 'hugeicons:google-sheet',
                    link: '/dashboard/timesheets',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 20,
                    roles: ['nurse']
                },
                {
                    id: 'leave',
                    label: 'Leave Management',
                    icon: 'fluent:calendar-20-regular',
                    link: '/dashboard/employee-leave',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 30,
                    roles: ['nurse']
                }
            ]
        },

        // Senior Carer-specific items
        {
            id: 'senior-carer-items',
            label: 'Senior Carer',
            icon: 'fluent:scan-person-20-regular',
            order: 60,
            organizationCategories: ['*'],
            items: [
                {
                    id: 'profile',
                    label: 'Profile',
                    icon: 'fluent:scan-person-20-regular',
                    link: '/dashboard/carer-profile',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 10,
                    roles: ['senior_carer']
                },
                {
                    id: 'timesheets',
                    label: 'Timesheets',
                    icon: 'hugeicons:google-sheet',
                    link: '/dashboard/timesheets',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 20,
                    roles: ['senior_carer']
                },
                {
                    id: 'leave',
                    label: 'Leave Management',
                    icon: 'fluent:calendar-20-regular',
                    link: '/dashboard/employee-leave',
                    requiredPermissions: [],
                    organizationCategories: ['*'],
                    order: 30,
                    roles: ['senior_carer']
                }
            ]
        }
    ]
};

export default menuConfig;