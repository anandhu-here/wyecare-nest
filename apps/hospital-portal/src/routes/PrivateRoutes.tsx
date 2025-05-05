import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export function PrivateRoute() {
    const location = useLocation();

    // TODO: Replace with actual auth state from Redux
    const isAuthenticated = false;
    const isLoading = false;

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Save the location they were trying to go to for a redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, render the child routes
    return <Outlet />;
}

export default PrivateRoute;