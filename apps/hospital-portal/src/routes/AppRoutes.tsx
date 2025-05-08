import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '@/features/auth/authSlice';

// Auth components and layout
import AuthLayout from '@/components/layout/AuthLayout';

// Protected route wrapper
import { PrivateRoute } from './PrivateRoutes';
import LoginPage from '@/pages/auth/Login';
import AcceptInvitationPage from '@/pages/auth/AcceptInvitations';
import AppLayout from '@/components/layout/Applayout';
import UserInvitePage from '@/pages/users/UserInvitePage';
import UsersPage from '@/pages/users/UsersList';
import SettingsLayout from '@/pages/organizations/Settings';
import ProfileTab from '@/pages/organizations/components/settings/profile';
import CareHomePreferences from '@/pages/organizations/components/settings/home-preference';
import ShiftSettingsPage from '@/pages/organizations/components/settings/shift-settings';
import ShiftPaymentsPage from '@/pages/organizations/components/settings/shift-payments';
import CompensationPage from '@/pages/organizations/components/settings/staff-compensation';


// Dashboard placeholder
const DashboardPage = () => (
    <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Welcome to the Hospital Portal Dashboard</p>
    </div>
);

// Error pages
const NotFoundPage = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <p className="text-xl mt-4">Page not found</p>
            <button
                onClick={() => window.history.back()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded"
            >
                Go Back
            </button>
        </div>
    </div>
);

export function AppRoutes() {
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isAuthLoading = useAppSelector(selectAuthLoading);

    // Auto-redirect when auth state changes
    useEffect(() => {
        if (isAuthenticated && window.location.pathname === '/login') {
            console
                .log('Redirecting to dashboard...');
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <Routes>
            {/* Public routes - Authentication */}
            <Route element={<AuthLayout />}>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
                />
                <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Organizations */}
                    <Route path="/organizations" element={<div>Organizations List</div>} />
                    <Route path="/organizations/:id" element={<div>Organization Details</div>} />

                    <Route path='/schedule' element={
                        <div className="p-4">
                            <h1 className="text-2xl font-bold mb-4">Schedule</h1>
                            <p>Welcome to the Schedule page</p>
                        </div>
                    } />

                    {/* settings */}

                    {/* <Route path="/settings/profile" element={<div>Settings</div>} />
                    <Route path="/settings/notifications" element={<div>Settings</div>} />
                    <Route path="/settings/organization" element={<SettingsLayout />} /> */}


                    <Route path="/settings">
                        <Route path="profile" element={<ProfileTab />} />
                        <Route path='shifts' element={<ShiftSettingsPage />} />
                        <Route path='Shifts-payments' element={<CompensationPage />} />
                        <Route path="account-settings" element={<div>Account Settings</div>} />
                        <Route path="staff-settings" element={<div>Staff Settings</div>} />
                        <Route path="subscription" element={<div>Subscription</div>} />
                    </Route>


                    {/* Appointments */}

                    {/* Patients */}


                    {/* Users */}
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/invite" element={<UserInvitePage />} />
                    <Route path="/users/:id" element={<div>User Details</div>} />

                    {/* Roles */}
                    <Route path="/roles" element={<div>Roles List</div>} />
                    <Route path="/roles/:id" element={<div>Role Details</div>} />

                    {/* Permissions */}
                    <Route path="/permissions" element={<div>Permissions List</div>} />

                    {/* Settings */}
                    <Route path="/settings" element={<div>Settings</div>} />
                </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

            {/* 404 - Not Found */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default AppRoutes;