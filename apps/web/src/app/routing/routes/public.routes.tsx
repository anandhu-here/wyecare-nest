
// libs/web/features/src/lib/routing/routes/public.routes.tsx
import OrganizationLinkVerify from '@/app/features/organization/components/invitation-verification';
import { BaseLayout } from '@/app/layouts';
import { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

// Placeholder for public pages - replace with actual components when ready
const NotFound = () => <div>404 - Page Not Found</div>;

export const publicRoutes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: '404',
        element: <BaseLayout><NotFound /></BaseLayout>
    },
    {
        path: '*',
        element: <Navigate to="/404" replace />
    },

];