// libs/web/features/src/lib/auth/views/email-verification.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

interface EmailVerificationProps {
    onVerified: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ onVerified }) => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    // User details from local storage
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Get user from local storage
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            setUserEmail(user.email || '');
        }

        // Start countdown for resend button
        const timer = setInterval(() => {
            setCountdown((prevCount) => {
                if (prevCount <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prevCount - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        try {
            // Replace with your actual API call
            await fetch('/api/v1/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Reset countdown
            setCountdown(60);
            setCanResend(false);
        } catch (err) {
            setError('Failed to resend verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationCode.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // This is a placeholder - replace with your actual API call
            // In a real implementation, you would verify the code with your backend
            const response = await fetch('/api/v1/auth/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    code: verificationCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Verification failed');
            }

            setVerificationStatus('success');

            // Simulate a slight delay before proceeding
            setTimeout(() => {
                onVerified();
            }, 1500);

        } catch (err) {
            setVerificationStatus('error');
            setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // For demo purposes - shortcut verification (remove in production)
    const handleSkipVerification = () => {
        setVerificationStatus('success');
        setTimeout(() => {
            onVerified();
        }, 1500);
    };

    const renderContent = () => {
        if (verificationStatus === 'success') {
            return (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-green-100 p-3 mb-4">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                    <p className="text-muted-foreground mb-6 text-center">
                        Your email has been successfully verified. Redirecting...
                    </p>
                </div>
            );
        }

        return (
            <>
                <div className="mb-8 flex flex-col items-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <Mail className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                    <p className="text-muted-foreground text-center">
                        We've sent a verification code to<br />
                        <span className="font-medium">{userEmail}</span>
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter verification code"
                            className="text-center text-lg tracking-widest h-12"
                            maxLength={6}
                        />
                    </div>

                    <Button
                        onClick={handleVerify}
                        disabled={loading || !verificationCode.trim()}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify Email
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Didn't receive a code?
                        </p>
                        <Button
                            variant="ghost"
                            disabled={!canResend || loading}
                            onClick={handleResendCode}
                            className="h-auto p-0 text-primary"
                        >
                            {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                        </Button>
                    </div>
                </div>

                {/* Remove this in production - for demo purposes only */}
                <div className="mt-12 pt-6 border-t border-muted">
                    <Button
                        variant="outline"
                        onClick={handleSkipVerification}
                        className="w-full text-muted-foreground"
                        size="sm"
                    >
                        Skip Verification (Demo Only)
                    </Button>
                </div>
            </>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full p-4"
        >
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 px-6 pb-8">
                    {renderContent()}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default EmailVerification;