// libs/web/features/src/lib/routing/routes/dashboard.routes.tsx
import { RouteObject } from 'react-router-dom';
import AuthGuard from '../guards/auth.guard';
import { SidebarLayout, SidebarProvider, SidebarMenuProvider } from '@/app/layouts';
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


// Placeholder for Dashboard - replace with actual component when ready
const Dashboard = () => <div>Dashboard Component</div>;

// Placeholder component for all other routes
const PlaceholderPage = ({ title }: { title: string }) => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
        <p>This is a placeholder for the {title.toLowerCase()} functionality.</p>
    </div>
);

export const dashboardRoutes: RouteObject[] = [
    {
        path: 'staff-invitations/verify/:token',
        element: <AuthGuard requireAuth={true} ><StaffInvitationVerify /></AuthGuard>
    },
    {
        path: 'staff-invitations/accept',
        element: <AuthGuard requireAuth={true} ><AcceptStaffInvitation /></AuthGuard>
    },

    {
        path: 'dashboard',
        element: (
            <AuthGuard requireAuth={true}>
                <SidebarProvider>
                    <SidebarMenuProvider>
                        <SidebarLayout />
                    </SidebarMenuProvider>
                </SidebarProvider>
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: <LegacyDashBoardLayout />
            },

            // Admin routes
            {
                path: 'invitations',
                element: <PlaceholderPage title="Invitations" />
            },
            {
                path: 'invoices',
                element: <OrgInvoices />
            },

            // Settings routes with nested structure
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
                    }
                ]
            },

            {
                path: 'leave-management',
                element: <LeaveAdminDashboard />
            },

            // Care staff routes
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

            // Agency admin routes
            {
                path: 'agency-timesheets',
                element: <PlaceholderPage title="Agency Timesheets" />
            },
            {
                path: 'home-users',
                element: <OrganizationList />
            },
            {
                path: 'staffs',
                element: <OrganizationStaffsList />
            },

            // Home admin routes
            {
                path: 'residents',
                element: <PlaceholderPage title="Residents" />
            },
            {
                path: 'home-timesheets',
                element: <PlaceholderPage title="Home Timesheets" />
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
        ]
    }
];