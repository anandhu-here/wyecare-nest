import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
    Eye,
    EyeOff,
    Lock,
    User,
    Mail,
    Building,
    Briefcase,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import {
    useInvitationsControllerValidateTokenQuery,
    useAuthControllerRegisterMutation,
    useAuthControllerRegisterWithOrganizationMutation
} from '@/features/generatedApi';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { logout } from '@/features/auth/authSlice'; // Adjust the import path as needed

export function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // User form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Organization form state (only used for organization admins)
    const [orgName, setOrgName] = useState('');
    const [orgCategory, setOrgCategory] = useState('');
    const [orgDescription, setOrgDescription] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [orgPhone, setOrgPhone] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [needsOrganization, setNeedsOrganization] = useState(false);

    // Fetch invitation data
    const {
        data: invitationData,
        isLoading: invitationLoading,
        isError: invitationError,
        error: invitationErrorMessage,
    } = useInvitationsControllerValidateTokenQuery(token as any, {
        skip: !token,
    });

    // API mutations
    const [registerUser] = useAuthControllerRegisterMutation();
    const [registerWithOrganization] = useAuthControllerRegisterWithOrganizationMutation();

    // Set form data from invitation when it loads
    useEffect(() => {
        if (invitationData) {
            setEmail(invitationData.email);

            // Check if user needs to create organization
            if (invitationData.role?.name === 'Organization Admin' && !invitationData.organizationId) {
                setNeedsOrganization(true);
                // Pre-fill org email with user email
                setOrgEmail(invitationData.email);
            }
        }
    }, [invitationData]);

    // Handle logout after successful registration
    const handleLogout = () => {
        // Remove token from localStorage
        localStorage.removeItem('token');

        // Dispatch logout action
        dispatch(logout());

        // Navigate to login page
        navigate('/login');
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Form validation
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

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            // Prepare common user data
            const userData = {
                firstName,
                lastName,
                email,
                password
            };

            let response;

            if (needsOrganization && currentStep === 2) {
                // Organization validation
                if (!orgName || !orgCategory) {
                    setError('Organization name and category are required');
                    setIsLoading(false);
                    return;
                }

                try {
                    // Create organization data - convert category to match the enum format in Prisma
                    const organizationData = {
                        name: orgName,
                        // Convert to uppercase to match OrgCategory enum format in Prisma schema
                        category: orgCategory.toUpperCase(),
                        description: orgDescription,
                        email: orgEmail,
                        phone: orgPhone
                    };

                    // Register with organization
                    response = await registerWithOrganization({
                        user: userData,
                        organization: organizationData,
                        invitationToken: token
                    }).unwrap();

                    toast.success('Account and organization created successfully!');

                    // Add a slight delay before logout to allow the user to see the toast
                    setTimeout(() => {
                        handleLogout();
                    }, 1500);

                } catch (err) {
                    console.error('Organization creation error details:', err);
                    setError(err.data?.message || 'Organization creation failed. Please try again.');
                    setIsLoading(false);
                    return;
                }
            } else {
                // Regular user registration
                response = await registerUser({
                    ...userData,
                    invitationToken: token
                }).unwrap();

                toast.success('Account created successfully!');

                // Add a slight delay before logout to allow the user to see the toast
                setTimeout(() => {
                    handleLogout();
                }, 1500);
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Move to next step in multi-step form
    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate before moving to next step
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

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setError(null);
        setCurrentStep(2);
    };

    // Loading state
    if (invitationLoading) {
        return (
            <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[400px] p-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Validating invitation</h2>
                <p className="text-muted-foreground text-center">
                    Please wait while we validate your invitation...
                </p>
            </div>
        );
    }

    // Invalid token
    if (invitationError || !invitationData) {
        return (
            <div className="max-w-md mx-auto p-8 bg-background border rounded-lg shadow-sm">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-semibold text-destructive">Invalid Invitation</h2>
                    <p className="text-muted-foreground text-center">
                        This invitation link is invalid or has expired.
                    </p>
                    <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => navigate('/login')}
                    >
                        Return to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <Card className="p-6">
                {needsOrganization ? (
                    <Tabs defaultValue="account" value={currentStep === 1 ? "account" : "organization"}>
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger
                                value="account"
                                onClick={() => setCurrentStep(1)}
                                disabled={isLoading}
                            >
                                Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="organization"
                                onClick={() => setCurrentStep(2)}
                                disabled={currentStep === 1 || isLoading}
                            >
                                Organization
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="account" className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Create Your Account</h1>
                                <p className="text-muted-foreground">
                                    {invitationData.role?.name ?
                                        `Complete your registration as ${invitationData.role.name}` :
                                        'Complete your registration to join the platform'}
                                </p>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start">
                                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-destructive text-sm">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleNextStep} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
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
                                    <p className="text-xs text-muted-foreground">This email is from your invitation and cannot be changed</p>
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
                                    <Label htmlFor="password">Password</Label>
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
                                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
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

                                <div className="space-y-2">
                                    <Label>Your Role</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <Input
                                            type="text"
                                            value={invitationData.role?.name || 'Team Member'}
                                            className="pl-10"
                                            disabled={true}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    Continue to Organization Setup
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="organization" className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Set Up Your Organization</h1>
                                <p className="text-muted-foreground">
                                    Create your organization as an administrator
                                </p>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start">
                                    <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-destructive text-sm">{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="orgName"
                                            type="text"
                                            placeholder="Acme Inc"
                                            className="pl-10"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orgCategory">Category</Label>
                                    <Select
                                        value={orgCategory}
                                        onValueChange={setOrgCategory}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="care_home">Care Home</SelectItem>
                                            <SelectItem value="hospital">Hospital</SelectItem>
                                            <SelectItem value="education">Educational Institution</SelectItem>
                                            <SelectItem value="healthcare">Healthcare Provider</SelectItem>
                                            <SelectItem value="social_services">Social Services</SelectItem>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="service_provider">Service Provider</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orgDescription">Description</Label>
                                    <Textarea
                                        id="orgDescription"
                                        placeholder="Brief description of your organization"
                                        value={orgDescription}
                                        onChange={(e) => setOrgDescription(e.target.value)}
                                        disabled={isLoading}
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="orgEmail">Contact Email</Label>
                                        <Input
                                            id="orgEmail"
                                            type="email"
                                            placeholder="contact@organization.com"
                                            value={orgEmail}
                                            onChange={(e) => setOrgEmail(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="orgPhone">Phone Number</Label>
                                        <Input
                                            id="orgPhone"
                                            type="text"
                                            placeholder="+1 (555) 123-4567"
                                            value={orgPhone}
                                            onChange={(e) => setOrgPhone(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setCurrentStep(1)}
                                        disabled={isLoading}
                                    >
                                        Back
                                    </Button>

                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Complete Registration'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                ) : (
                    // Regular user account creation (no organization setup)
                    <>
                        <div className="space-y-2 mb-6">
                            <h1 className="text-2xl font-bold tracking-tight">Create Your Account</h1>
                            <p className="text-muted-foreground">
                                {invitationData.organization?.name ?
                                    `Join ${invitationData.organization.name} as ${invitationData.role?.name || 'a team member'}` :
                                    'Complete your registration to join the platform'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start mb-6">
                                <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-destructive text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
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
                                <p className="text-xs text-muted-foreground">This email is from your invitation and cannot be changed</p>
                            </div>

                            {invitationData.organization?.name && (
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Organization</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                            <Building className="h-4 w-4" />
                                        </div>
                                        <Input
                                            id="organization"
                                            type="text"
                                            value={invitationData.organization?.name}
                                            className="pl-10"
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                            )}

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
                                <Label htmlFor="password">Password</Label>
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
                                <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>
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

                            <div className="space-y-2">
                                <Label>Your Role</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="text"
                                        value={invitationData.role?.name || 'Team Member'}
                                        className="pl-10"
                                        disabled={true}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Complete Registration'
                                )}
                            </Button>
                        </form>
                    </>
                )}

                <div className="text-center mt-6">
                    <p className="text-xs text-muted-foreground">
                        By accepting this invitation, you agree to the{' '}
                        <a href="/terms" className="text-primary font-medium hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </Card>
        </div>
    );
}

export default AcceptInvitationPage;