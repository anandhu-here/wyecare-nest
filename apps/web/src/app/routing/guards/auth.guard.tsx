// libs/web/features/src/lib/routing/guards/auth.guard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectPermissions, selectRedirectUrl, selectToken } from '@/app/features/auth/AuthSlice';
import { useProfileQuery } from '@/app/features/auth/authApi';

interface AuthGuardProps {
    children: ReactNode;
    requireAuth?: boolean; // true for protected routes, false for public routes
    requiredPermissions?: string[]; // permissions required to access the route
}

/**
 * AuthGuard component to protect routes based on authentication state and permissions
 * 
 * @param children - The route component to render if conditions are met
 * @param requireAuth - Whether authentication is required (default: true)
 * @param requiredPermissions - List of permissions required to access the route
 */
export const AuthGuard = ({
    children,
    requireAuth = true,
    requiredPermissions = []
}: AuthGuardProps) => {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Get auth state from Redux
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const token = useSelector(selectToken);
    const permissions = useSelector(selectPermissions);
    const redirectUrl = useSelector(selectRedirectUrl);

    // Store the requested URL to return to after auth
    useEffect(() => {
        // Only save the location if this is a protected route that requires login
        if (requireAuth && !isAuthenticated && !location.pathname.startsWith('/auth')) {
            sessionStorage.setItem('requestedLocation', JSON.stringify({
                pathname: location.pathname,
                search: location.search,
                hash: location.hash
            }));
        }
    }, [location, requireAuth, isAuthenticated]);

    // Fetch profile if we have a token but don't have full auth data yet
    const { data: profileData, isLoading: profileLoading, isSuccess: profileSuccess } = useProfileQuery(undefined, {
        // Only skip if we definitely have no token or we're already fully authenticated
        skip: !token || (isAuthenticated && authInitialized)
    });

    // Handle authentication initialization
    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                // We have a token, wait for profile query to complete
                if (!profileLoading && (profileSuccess || !token)) {
                    setAuthInitialized(true);
                    setIsLoading(false);
                }
            } else {
                // No token, we're definitely not authenticated
                setAuthInitialized(true);
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, [token, profileLoading, profileSuccess, isAuthenticated]);

    // Show loading state while authentication is being determined
    if (isLoading || !authInitialized) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    // Handle protected routes - user not authenticated
    if (requireAuth && !isAuthenticated) {
        // Redirect to login page with the return url
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // Check permissions if required
    if (requireAuth && isAuthenticated && requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(permission =>
            permissions.includes(permission)
        );

        if (!hasRequiredPermissions) {
            // Redirect to dashboard if user doesn't have required permissions
            return <Navigate to="/dashboard" replace />;
        }
    }

    // For public routes (like login) - if already authenticated, check if we need to return to a requested page
    if (!requireAuth && isAuthenticated) {
        // Check if there's a stored location from a previous attempt to access a protected route
        const storedLocationJson = sessionStorage.getItem('requestedLocation');

        if (storedLocationJson) {
            try {
                const storedLocation = JSON.parse(storedLocationJson);
                // Clear the stored location
                sessionStorage.removeItem('requestedLocation');
                // Navigate to the originally requested URL
                return <Navigate to={storedLocation.pathname} state={{ from: location }} replace />;
            } catch (e) {
                console.error('Error parsing stored location:', e);
            }
        }

        // If no stored location or there was an error, go to default route
        return <Navigate to={redirectUrl || "/dashboard"} replace />;
    }

    // If the backend provided a redirect URL, and we're at the root/dashboard, use it
    if (isAuthenticated && redirectUrl && (location.pathname === '/' || location.pathname === '/dashboard')) {
        try {
            const redirectPath = new URL(redirectUrl).pathname;
            // Only redirect if the paths are different
            if (location.pathname !== redirectPath) {
                return <Navigate to={redirectPath} replace />;
            }
        } catch (e) {
            console.error('Error parsing redirect URL:', e);
        }
    }

    // If all conditions are met, render the children
    return <>{children}</>;
};

export default AuthGuard;