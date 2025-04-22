// libs/web/features/src/lib/auth/register-with-invitation.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SignupForm from './forms/signup-form';
import OrganizationForm from './forms/organization-form';
import EmailVerification from './views/email-verification';
import AuthWrapper from './AuthWrapper';
import GetStarted from './views/get-started';
import { selectRedirectUrl } from '../AuthSlice';
import { useProfileQuery } from '../authApi';

// Animation variants
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

const pageTransition = {
    duration: 0.5,
    ease: 'easeInOut',
};

interface RegisterWithInvitationProps {
    invitationType?: 'organization' | 'staff';
}

const RegisterWithInvitation: React.FC<RegisterWithInvitationProps> = ({
    invitationType = 'organization'
}) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [step, setStep] = useState('getStarted');
    const [token, setToken] = useState<string | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Get the redirectUrl from Redux state
    const redirectUrl = useSelector(selectRedirectUrl);

    // Fetch profile data when auth token is available
    const { data: profileData } = useProfileQuery(undefined, {
        skip: !localStorage.getItem('token')
    });

    // Handle mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Check for invitation token and type in URL
    useEffect(() => {
        const invitationToken = searchParams.get('token');
        const invitationType = searchParams.get('type') || 'organization';

        if (invitationToken) {
            setToken(invitationToken);
            setType(invitationType);
            localStorage.setItem('invitationToken', invitationToken);
            localStorage.setItem('invitationType', invitationType);
        } else {
            // Check if token is in localStorage (for page refreshes)
            const storedToken = localStorage.getItem('invitationToken');
            const storedType = localStorage.getItem('invitationType');

            if (storedToken) {
                setToken(storedToken);
                setType(storedType);
            } else {
                // No token found, redirect to login
                navigate('/auth/login');
            }
        }
    }, [searchParams, navigate]);

    // Use redirectUrl from backend when available
    useEffect(() => {
        // Only handle redirectUrl if we're in the appropriate steps
        if ((step === 'emailVerification' || step === 'organizationSignup') && redirectUrl) {
            // Clean up localStorage items no longer needed
            localStorage.removeItem('invitationToken');
            localStorage.removeItem('invitationType');

            // Navigate to the backend-provided redirect URL
            navigate(redirectUrl);
        }
    }, [redirectUrl, step, navigate]);

    const handleStart = () => setStep('userSignup');

    const handleUserSignup = (data: any) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUserData(data);
        setStep('emailVerification');
    };

    const handleEmailVerified = () => {
        // Update the user data to reflect verified email
        const user = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({ ...user, emailVerified: true }));

        // If we have a redirectUrl from backend, use it
        if (redirectUrl) {
            navigate(redirectUrl);
        } else {
            // Otherwise follow our normal flow logic
            if (type === 'staff') {
                navigate('/dashboard');
            } else {
                setStep('organizationSignup');
            }
        }
    };

    const handleOrganizationSignup = () => {
        // If we have a redirectUrl from backend, use it
        if (redirectUrl) {
            navigate(redirectUrl);
        } else {
            navigate('/dashboard');
        }
    };

    const renderStep = () => (
        <AnimatePresence mode="wait">
            {step === 'getStarted' && (
                <motion.div
                    key="getStarted"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="w-full"
                >
                    <GetStarted
                        onStart={handleStart}
                        invitationType={type as 'organization' | 'staff'}
                    />
                </motion.div>
            )}
            {step === 'userSignup' && (
                <motion.div
                    key="userSignup"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="w-full bg-background"
                >
                    <SignupForm
                        onSubmit={handleUserSignup}
                        invitationToken={token}
                        invitationType={type as 'organization' | 'staff'}
                    />
                </motion.div>
            )}
            {step === 'emailVerification' && (
                <motion.div
                    key="emailVerification"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="w-full"
                >
                    <EmailVerification onVerified={handleEmailVerified} />
                </motion.div>
            )}
            {step === 'organizationSignup' && type === 'organization' && (
                <motion.div
                    key="organizationSignup"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                    className="w-full bg-background"
                >
                    <OrganizationForm onSubmit={handleOrganizationSignup} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return <AuthWrapper>{renderStep()}</AuthWrapper>;
};

export default RegisterWithInvitation;