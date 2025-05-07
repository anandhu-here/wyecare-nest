import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Building, Shield } from 'lucide-react';

// Import UI components
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

// Placeholder hooks - Replace with your actual API hooks
const useValidateInvitationQuery = (token: string) => {
    // This would be replaced with your actual RTK Query hook
    return {
        data: {
            email: 'invited@example.com',
            role: { id: '2', name: 'Doctor' },
            organization: { id: '1', name: 'General Hospital', category: 'HOSPITAL' },
            department: { id: '2', name: 'Cardiology' },
            invitedBy: { name: 'Dr. Admin' },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        },
        isLoading: false,
        error: null,
        refetch: () => { }
    };
};

const useAcceptInvitationMutation = () => {
    // This would be replaced with your actual RTK Query mutation hook
    return [
        async (data: any) => {
            // Simulate API call
            console.log('Accepting invitation:', data);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true, data: { token: 'jwt-token-here' } };
        },
        { isLoading: false, error: null }
    ] as const;
};

export function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    // State for the form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationError_, setValidationError] = useState<string | null>(null);

    // Validate invitation token
    const { data: invitation, isLoading: isValidating, error: validationError } =
        useValidateInvitationQuery(token || '');

    // Accept invitation mutation
    const [acceptInvitation, { isLoading: isSubmitting }] = useAcceptInvitationMutation();

    // Validate token on mount
    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Validate form
        if (!firstName || !lastName) {
            setValidationError('First name and last name are required');
            return;
        }

        if (!password) {
            setValidationError('Password is required');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setValidationError('Password must be at least 8 characters long');
            return;
        }

        try {
            // Submit registration
            const result = await acceptInvitation({
                token,
                firstName,
                lastName,
                password
            });

            // Show success message
            toast.success('Account created successfully!');

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error accepting invitation:', error);
            setValidationError('Failed to create account. Please try again.');
        }
    };

    // Loading state
    if (isValidating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <h2 className="text-2xl font-semibold">Validating invitation...</h2>
                </div>
                <p className="text-muted-foreground mt-2">Please wait while we verify your invitation</p>
            </div>
        );
    }

    // Error state - invalid token
    if (validationError || !invitation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-8 w-8" />
                    <h2 className="text-2xl font-semibold">Invalid Invitation</h2>
                </div>
                <p className="text-muted-foreground mt-2">This invitation link is invalid or has expired</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/login')}
                >
                    Return to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <Card className="shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Accept Invitation</CardTitle>
                    <CardDescription>
                        Complete your account setup to join {invitation.organization.name}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-4 mb-4">
                        <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded-md">
                            <Building className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">{invitation.organization.name}</p>
                                <p className="text-xs text-muted-foreground">Organization</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded-md">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">{invitation.role.name}</p>
                                <p className="text-xs text-muted-foreground">Role</p>
                            </div>
                        </div>

                        {invitation.department && (
                            <div className="flex items-center space-x-2 bg-muted p-3 rounded-md">
                                <div className="h-5 w-5 flex items-center justify-center text-primary">
                                    <span className="text-xs font-bold">D</span>
                                </div>
                                <div>
                                    <p className="font-medium">{invitation.department.name}</p>
                                    <p className="text-xs text-muted-foreground">Department</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <form id="invitation-form" onSubmit={handleSubmit} className="space-y-4">
                        {validationError && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {validationError}
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <div className="space-y-2 flex-1">
                                <FormLabel htmlFor="firstName">First Name</FormLabel>
                                <FormControl>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </FormControl>
                            </div>

                            <div className="space-y-2 flex-1">
                                <FormLabel htmlFor="lastName">Last Name</FormLabel>
                                <FormControl>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </FormControl>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <FormLabel htmlFor="email">Email</FormLabel>
                            <FormControl>
                                <Input
                                    id="email"
                                    type="email"
                                    value={invitation.email}
                                    disabled={true}
                                    className="bg-muted"
                                />
                            </FormControl>
                            <FormDescription>
                                Email address is pre-filled from your invitation
                            </FormDescription>
                        </div>

                        <div className="space-y-2">
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                            <FormDescription>
                                Password must be at least 8 characters long
                            </FormDescription>
                        </div>

                        <div className="space-y-2">
                            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </FormControl>
                        </div>
                    </form>
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        form="invitation-form"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete Registration
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-4">
                By accepting this invitation, you agree to the {' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and {' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
        </div>
    );
}

export default AcceptInvitationPage;