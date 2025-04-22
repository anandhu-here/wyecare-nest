export interface MenuItem {
  label: string;
  icon: string;
  link?: string;
  submenu?: MenuItem[];
  badgeContent?: string | number;
}

export const calculateMenuItems = (
  user: any,
  currentOrganization: any,
  homeSettings: any
): MenuItem[] => {
  if (!user || !currentOrganization || !user.role) {
    return [];
  }

  const commonItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'material-symbols-light:home-outline',
      link: '/dashboard',
    },
  ];

  const roleSpecificItems: Record<string, MenuItem[]> = {
    admin: [
      {
        label: 'Invitations',
        icon: 'fluent:mail-20-regular',
        link: '/dashboard/invitations',
      },
      {
        label: 'Invoices',
        icon: 'fluent:document-20-regular',
        link: '/dashboard/invoices',
      },
      {
        label: 'Settings',
        icon: 'mingcute:settings-3-fill',
        link: '/dashboard/settings',
      },
      {
        label: 'Leave',
        icon: 'fluent:calendar-20-regular',
        link: '/dashboard/leave-management',
      },
    ],

    owner: [
      {
        label: 'Invitations',
        icon: 'fluent:mail-20-regular',
        link: '/dashboard/invitations',
      },
      {
        label: 'Invoices',
        icon: 'fluent:document-20-regular',
        link: '/dashboard/invoices',
      },
      {
        label: 'Settings',
        icon: 'mingcute:settings-3-fill',
        link: '/dashboard/settings',
      },
      {
        label: 'Leave',
        icon: 'fluent:calendar-20-regular',
        link: '/dashboard/leave-management',
      },
    ],

    carer: [
      {
        label: 'Profile',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/carer-profile',
      },
      {
        label: 'timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/timesheets',
      },
      {
        label: 'Leave',
        icon: 'fluent:calendar-20-regular',
        link: '/dashboard/employee-leave',
      },
    ],
    nurse: [
      {
        label: 'Profile',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/nurse-profile',
      },
      {
        label: 'timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/timesheets',
      },
      {
        label: 'Leave Management',
        icon: 'fluent:calendar-20-regular',
        link: '/dashboard/employee-leave',
      },
    ],
    senior_carer: [
      {
        label: 'Profile',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/carer-profile',
      },
      {
        label: 'timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/timesheets',
      },
      {
        label: 'Leave Management',
        icon: 'fluent:calendar-20-regular',
        link: '/dashboard/employee-leave',
      },
    ],
  };

  if (currentOrganization.type === 'agency') {
    roleSpecificItems.admin.push(
      {
        label: 'Timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/agency-timesheets',
      },
      {
        label: 'Homes',
        icon: 'material-symbols-light:home-work',
        link: '/dashboard/home-users',
      },
      {
        label: 'Staffs',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/staffs',
      }
    );
    roleSpecificItems.owner.push(
      {
        label: 'Timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/agency-timesheets',
      },
      {
        label: 'Homes',
        icon: 'material-symbols-light:home-work',
        link: '/dashboard/home-users',
      },
      {
        label: 'Staffs',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/staffs',
      }
    );
  } else if (currentOrganization.type === 'home') {
    roleSpecificItems.admin.push(
      {
        label: 'Residents',
        icon: 'healthicons:elderly-outline',
        link: '/dashboard/residents',
      },
      {
        label: 'Timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/home-timesheets',
      },
      {
        label: 'Attendance',
        icon: 'fluent:people-20-regular',
        link: '/dashboard/attendance-registry',
      },
      {
        label: 'Agencies',
        icon: 'octicon:organization-24',
        link: '/dashboard/agency-users',
      },
      {
        label: 'Staffs',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/staffs',
      }
    );
    roleSpecificItems.owner.push(
      {
        label: 'Residents',
        icon: 'healthicons:elderly-outline',
        link: '/dashboard/residents',
      },
      {
        label: 'Timesheets',
        icon: 'hugeicons:google-sheet',
        link: '/dashboard/home-timesheets',
      },
      {
        label: 'Attendance',
        icon: 'fluent:people-20-regular',
        link: '/dashboard/attendance-registry',
      },
      {
        label: 'Agencies',
        icon: 'octicon:organization-24',
        link: '/dashboard/agency-users',
      },
      {
        label: 'Staffs',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/staffs',
      }
    );

    if (homeSettings.allowResident3rdParty) {
      roleSpecificItems.admin.push({
        label: 'Third Parties',
        icon: 'fluent:scan-person-20-regular',
        link: '/dashboard/home-thirdparties',
      });
    }
  }

  return [...commonItems, ...(roleSpecificItems[user.role] || [])];
};
