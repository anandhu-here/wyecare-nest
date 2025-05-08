import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectAuthLoading, logout } from '@/features/auth/authSlice';
import { useAuthControllerGetProfileQuery } from '@/features/generatedApi';

export function PrivateRoute() {
    const location = useLocation();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isAuthLoading = useAppSelector(selectAuthLoading);
    const dispatch = useAppDispatch();

    // Use RTK Query to fetch the user profile if we have a token but no user data
    const { isLoading: isProfileLoading,
        error: profileError,
        data: profileData,
        isError: isProfileError,
        isSuccess: isProfileSuccess,
    } = useAuthControllerGetProfileQuery(undefined, {
        // Skip the query if not authenticated
        skip: !isAuthenticated,
    });

    useEffect(() => {
        if (isProfileSuccess && profileData) {
            // Handle successful profile fetch if needed
            console.log('Profile fetched successfully:', profileData);
        } else if (isProfileError) {
            dispatch(logout()); // Log out if there's an error fetching the profile
        }
    }, [isProfileSuccess, profileData, isProfileError, dispatch]);


    // Combined loading state
    const isLoading = isAuthLoading || isProfileLoading;

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