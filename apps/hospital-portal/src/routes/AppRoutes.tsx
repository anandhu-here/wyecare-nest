import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth components and layout
import AuthLayout from '@/components/layout/AuthLayout';
// Protected route wrapper
import { PrivateRoute } from './PrivateRoutes';
import LoginPage from '@/pages/auth/Login';
import AcceptInvitationPage from '@/pages/auth/AcceptInvitations';

// Placeholder for dashboard - will be implemented later
const DashboardPage = () => <div>Dashboard Page</div>;

export function AppRoutes() {
    // Mock authentication state - will be replaced with actual state from Redux
    const isAuthenticated = false;

    return (
        <Routes>
            {/* Public routes - Authentication */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                } />
                <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Additional protected routes will be added here */}
            </Route>

            {/* Redirect to login if no route matches */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default AppRoutes;