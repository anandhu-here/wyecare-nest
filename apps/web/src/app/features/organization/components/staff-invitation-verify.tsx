// StaffInvitationVerify.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVerifyStaffInvitationQuery } from '../organizationApi';
import { Loader2 } from 'lucide-react';

const StaffInvitationVerify = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Skip if no token
    const { data, isLoading, error } = useVerifyStaffInvitationQuery(token, {
        skip: !token
    });

    useEffect(() => {
        if (!token) {
            navigate('/auth/login');
            return;
        }

        if (data) {
            // If user exists, redirect to accept-invitation
            // Otherwise, redirect to register-with-invitation
            if (data.userExists) {
                navigate(`/auth/accept-invitation?token=${token}&type=staff`);
            } else {
                navigate(`/auth/register-with-invitation?token=${token}&type=staff`);
            }
        }
    }, [data, token, navigate]);

    // Handle errors
    useEffect(() => {
        if (error) {
            // Could redirect to an error page or show an error message
            navigate('/auth/login?error=invalid_invitation');
        }
    }, [error, navigate]);

    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Verifying invitation...</span>
        </div>
    );
};

export default StaffInvitationVerify;