import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, User, Mail, Building } from 'lucide-react';

export function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [organization, setOrganization] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitationInfo, setInvitationInfo] = useState<any>(null);

    // Validate the invitation token
    useEffect(() => {
        const validateToken = async () => {
            try {
                // TODO: Replace with actual API call from RTK Query
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Simulate successful token validation with invitation details
                setInvitationInfo({
                    email: 'invited@example.com',
                    organization: 'Example Hospital',
                    role: 'Doctor'
                });

                // Pre-fill the email field
                setEmail('invited@example.com');
                setOrganization('Example Hospital');
                setValidating(false);
            } catch (err) {
                setError('Invalid or expired invitation token');
                setValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!firstName || !lastName) {
            setError('First name and last name are required');
            return;
        }

        if (!password) {
            setError('Password is required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Simple password validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // TODO: Replace with actual API call from RTK Query
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Registration completed with:', {
                firstName,
                lastName,
                email,
                password,
                token
            });

            // Redirect to dashboard or success page
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (validating) {
        return (
            <div className="space-y-6 text-center">
                <h2 className="text-2xl font-semibold">Validating invitation</h2>
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
                <p className="text-muted-foreground">Please wait while we validate your invitation...</p>
            </div>
        );
    }

    if (error && !invitationInfo) {
        return (
            <div className="space-y-6 text-center">
                <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-destructive">Invalid Invitation</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button
                    variant="default"
                    className="mt-4"
                    onClick={() => navigate('/login')}
                >
                    Return to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Accept Invitation</h1>
                <p className="text-muted-foreground">
                    Complete your account setup for {invitationInfo?.organization}
                </p>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email (provided in invitation)</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                            <Mail className="h-4 w-4" />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            className="pl-10"
                            disabled={true}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                            <Building className="h-4 w-4" />
                        </div>
                        <Input
                            id="organization"
                            type="text"
                            value={organization}
                            className="pl-10"
                            disabled={true}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                <User className="h-4 w-4" />
                            </div>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="John"
                                className="pl-10"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Create Password</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                            <Lock className="h-4 w-4" />
                        </div>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                            <Lock className="h-4 w-4" />
                        </div>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full"
                        variant="gradient"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                </div>
            </form>

            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    By accepting this invitation, you agree to the
                    <a href="/terms" className="text-primary font-medium hover:underline mx-1">Terms of Service</a>
                    and
                    <a href="/privacy" className="text-primary font-medium hover:underline ml-1">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}

export default AcceptInvitationPage;