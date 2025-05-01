// libs/web/features/src/lib/routing/routes/dashboard.routes.tsx
import { RouteObject } from 'react-router-dom';
import AuthGuard from '../guards/auth.guard';
import { SidebarLayout } from '@/app/layouts';
import DashboardLayout from '@/app/layouts/dashboard/DashboardLayout';
import OrganizationList from '@/app/features/organization/organization-list';
import OrganizationLinkVerify from '@/app/features/organization/components/invitation-verification';
import OrganizationStaffsList from '@/app/features/organization/organization-staffs-list';
import StaffInvitationVerify from '@/app/features/organization/components/staff-invitation-verify';
import AcceptStaffInvitation from '@/app/features/organization/components/accept-staff-invitation';
import LegacyDashBoardLayout from '@/app/layouts/dashboard/LegacyLayout';
import SettingsLayout from '@/app/features/organization/Settings';
import ProfileTab from '@/app/features/organization/components/settings/profile';
import AgencyPreferences from '@/app/features/organization/components/settings/agency-preference';
import AccountSettingsTab from '@/app/features/organization/components/settings/account-settings';
import OrgInvoices from '@/app/features/invoice';
import LeaveAdminDashboard from '@/app/features/leave-management/leave-admin';
import OrganizationTimesheets from '@/app/features/timesheets/organization';
import AttendanceRegistry from '@/app/features/attendance';
import EmployeeProfilePage from '@/app/features/employee';
import EmployeeTimesheets from '@/app/features/employee/timesheets';
import EmployerShiftCalendar from '@/app/features/shift/components/org-shift-calendar';
import SchedulingCalendars from '@/app/features/scheduling/calendars';

// Placeholder for Dashboard - replace with actual component when ready
const Dashboard = () => <div>Dashboard Component</div>;

// Placeholder component for all other routes
const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
        <p>This is a placeholder for the {title.toLowerCase()} functionality.</p>
    </div>
);

/**
 * Routes that appear outside the main dashboard layout
 */
export const authenticationRoutes: RouteObject[] = [
    {
        path: 'staff-invitations/verify/:token',
        element: <AuthGuard requireAuth={true}><StaffInvitationVerify /></AuthGuard>
    },
    {
        path: 'staff-invitations/accept',
        element: <AuthGuard requireAuth={true}><AcceptStaffInvitation /></AuthGuard>
    },
];

/**
 * Main dashboard routes - organized by feature rather than by role
 * Uses the new SidebarLayout with ShadCN integration
 */
export const dashboardRoutes: RouteObject[] = [
    ...authenticationRoutes,
    {
        path: 'dashboard',
        element: (
            <AuthGuard requireAuth={true}>
                <SidebarLayout />
            </AuthGuard>
        ),
        children: [
            // Dashboard overview
            {
                index: true,
                element: <LegacyDashBoardLayout />
            },
            {
                path: 'analytics',
                element: <PlaceholderPage title="Analytics" />
            },

            // Original routes from your previous implementation
            {
                path: 'invitations',
                element: <PlaceholderPage title="Invitations" />
            },
            {
                path: 'invoices',
                element: <OrgInvoices />
            },
            {
                path: 'settings',
                element: <SettingsLayout />,
                children: [
                    {
                        index: true,
                        element: <ProfileTab />
                    },
                    {
                        path: 'profile',
                        element: <ProfileTab />
                    },
                    {
                        path: 'shift-settings',
                        element: <AgencyPreferences />
                    },
                    {
                        path: 'account',
                        element: <AccountSettingsTab />
                    },
                    {
                        path: 'permissions',
                        element: <PlaceholderPage title="Permissions" />
                    },
                    {
                        path: 'notifications',
                        element: <PlaceholderPage title="Notifications" />
                    },
                    {
                        path: 'organization',
                        element: <PlaceholderPage title="Organization Settings" />
                    }
                ]
            },
            {
                path: 'leave-management',
                element: <LeaveAdminDashboard />
            },
            {
                path: 'carer-profile',
                element: <EmployeeProfilePage />
            },
            {
                path: 'nurse-profile',
                element: <PlaceholderPage title="Nurse Profile" />
            },
            {
                path: 'org-timesheets',
                element: <OrganizationTimesheets />
            },
            {
                path: 'staff-timesheets',
                element: <EmployeeTimesheets />
            },
            {
                path: 'employee-leave',
                element: <PlaceholderPage title="Employee Leave" />
            },
            {
                path: 'home-users',
                element: <OrganizationList />
            },
            {
                path: 'staffs',
                element: <OrganizationStaffsList />
            },
            {
                path: 'residents',
                element: <PlaceholderPage title="Residents" />
            },
            {
                path: 'attendance-registry',
                element: <AttendanceRegistry />
            },
            {
                path: 'agency-users',
                element: <OrganizationList />
            },
            {
                path: 'home-thirdparties',
                element: <PlaceholderPage title="Third Parties" />
            },
            {
                path: 'organizations/link',
                element: <OrganizationLinkVerify />
            },

            // Additional routes to match the menu configuration paths
            // These match the paths in your web-ui menu config

            // Subject Management
            {
                path: 'subjects',
                element: <PlaceholderPage title="Subjects List" />
            },
            {
                path: 'subjects/add',
                element: <PlaceholderPage title="Add Subject" />
            },
            {
                path: 'subjects/groups',
                element: <PlaceholderPage title="Subject Groups" />
            },

            // Health Records
            {
                path: 'health-records',
                element: <PlaceholderPage title="Health Records" />
            },
            {
                path: 'medications',
                element: <PlaceholderPage title="Medications" />
            },

            // Staff Management
            {
                path: 'staff',
                element: <OrganizationStaffsList />
            },
            {
                path: 'staff/invite',
                element: <PlaceholderPage title="Invite Staff" />
            },
            {
                path: 'staff/roles',
                element: <PlaceholderPage title="Staff Roles" />
            },

            // Scheduling
            {
                path: 'schedule/calendar',
                element: <SchedulingCalendars />
            },
            {
                path: 'schedule/shifts',
                element: <PlaceholderPage title="Shifts" />
            },
            {
                path: 'schedule/leave',
                element: <LeaveAdminDashboard />
            },

            // Inventory Management
            {
                path: 'inventory',
                element: <PlaceholderPage title="Inventory" />
            },
            {
                path: 'inventory/suppliers',
                element: <PlaceholderPage title="Suppliers" />
            },

            // Finance
            {
                path: 'finance/invoices',
                element: <OrgInvoices />
            },
            {
                path: 'finance/payments',
                element: <PlaceholderPage title="Payments" />
            },
            {
                path: 'finance/payroll',
                element: <PlaceholderPage title="Payroll" />
            },

            // Tasks
            {
                path: 'tasks/my',
                element: <PlaceholderPage title="My Tasks" />
            },
            {
                path: 'tasks/all',
                element: <PlaceholderPage title="All Tasks" />
            },
            {
                path: 'tasks/templates',
                element: <PlaceholderPage title="Task Templates" />
            },

            // Reports
            {
                path: 'reports/standard',
                element: <PlaceholderPage title="Standard Reports" />
            },
            {
                path: 'reports/custom',
                element: <PlaceholderPage title="Custom Reports" />
            },

            // Catch-all route for development
            {
                path: '*',
                element: <PlaceholderPage title="Page Not Found" />
            }
        ]
    }
];