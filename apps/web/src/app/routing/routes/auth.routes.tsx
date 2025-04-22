// libs/web/features/src/lib/routing/routes/auth.routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import AuthGuard from '../guards/auth.guard';
import { BaseLayout } from '@/app/layouts';
import Login from '@/app/features/auth/components/Login';
import RegisterWithInvitation from '@/app/features/auth/components/register-with-invitation';
import AuthWrapper from '@/app/features/auth/components/AuthWrapper';
import OrganizationForm from '@/app/features/auth/components/forms/organization-form';
import CreateOrganization from '@/app/features/auth/components/forms/create-organization';

export const authRoutes: RouteObject[] = [
    {
        path: 'auth',
        element: <BaseLayout />,
        children: [
            {
                path: 'login',
                element: (
                    <AuthGuard requireAuth={false}>
                        <Login />
                    </AuthGuard>
                )
            },
            {
                path: 'register-with-invitation',
                element: (
                    <AuthGuard requireAuth={false}>
                        <RegisterWithInvitation invitationType="organization" />
                    </AuthGuard>
                )
            },
            {
                path: 'register-with-staff-invitation',
                element: (
                    <AuthGuard requireAuth={false}>
                        <RegisterWithInvitation invitationType="staff" />
                    </AuthGuard>
                )
            },
            {
                path: 'verify-email',
                element: (
                    <AuthGuard requireAuth={false}>
                        <AuthWrapper>
                            <>email </>
                        </AuthWrapper>
                    </AuthGuard>
                )
            },
            {
                path: 'create-organization',
                element: (
                    <AuthGuard requireAuth={true} requiredPermissions={['create_organization']}>
                        <CreateOrganization />
                    </AuthGuard>
                )
            },
            {
                path: 'join-organization',
                element: (
                    <AuthGuard requireAuth={true}>
                        <div>join </div>
                    </AuthGuard>
                )
            }
        ]
    }
];