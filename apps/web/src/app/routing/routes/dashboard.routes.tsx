// libs/web/features/src/lib/routing/routes/dashboard.routes.tsx
import { RouteObject } from 'react-router-dom';
import AuthGuard from '../guards/auth.guard';
import { SidebarLayout, SidebarProvider, SidebarMenuProvider } from '@/app/layouts';
import DashboardLayout from '@/app/layouts/dashboard/DashboardLayout';
import OrganizationList from '@/app/features/organization/organization-list';
import OrganizationLinkVerify from '@/app/features/organization/components/invitation-verification';
import OrganizationStaffsList from '@/app/features/organization/organization-staffs-list';

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
                element: <DashboardLayout />
            },

            // Admin routes
            {
                path: 'invitations',
                element: <PlaceholderPage title="Invitations" />
            },
            {
                path: 'invoices',
                element: <PlaceholderPage title="Invoices" />
            },
            {
                path: 'settings',
                element: <PlaceholderPage title="Settings" />
            },
            {
                path: 'leave-management',
                element: <PlaceholderPage title="Leave Management" />
            },

            // Care staff routes
            {
                path: 'carer-profile',
                element: <PlaceholderPage title="Carer Profile" />
            },
            {
                path: 'nurse-profile',
                element: <PlaceholderPage title="Nurse Profile" />
            },
            {
                path: 'timesheets',
                element: <PlaceholderPage title="Timesheets" />
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
                element: <PlaceholderPage title="Attendance Registry" />
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