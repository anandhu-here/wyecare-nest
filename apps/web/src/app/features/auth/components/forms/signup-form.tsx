// libs/web/features/src/lib/auth/views/signup-form.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

// Import UI components - adjust paths to match your structure
// import {
//     Card,
//     CardContent,
//     Button,
//     Input,
//     Label,
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
//     Alert,
//     AlertDescription,
//     Progress
// } from '@/components/ui';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectTrigger,
    SelectSeparator,
    SelectValue,
    SelectItem
} from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert';

import { Progress } from '@/components/ui/progress';
import { useSearchParams } from 'react-router-dom';


// Import icons
import {
    Loader2,
    User,
    Mail,
    Briefcase,
    Home,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';

import StepIndicator from '../step-indicator';
import { useDispatch } from 'react-redux';
import { useRegisterMutation, useRegisterWithOrgInvitationMutation, useRegisterWithStaffInvitationMutation } from '../../authApi';
import { setCredentials } from '../../AuthSlice';

// Data constants - keeping the same data structures
const countryCodes = [
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
];

const countries = [
    { name: 'India', code: 'IN', currency: 'INR' },
    { name: 'United States', code: 'US', currency: 'USD' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP' },
    { name: 'Australia', code: 'AU', currency: 'AUD' },
    { name: 'Canada', code: 'CA', currency: 'CAD' },
    // ... Add other countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Prefer not to say' },
];

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

interface SignupFormProps {
    onSubmit: (data: any) => void;
    invitationToken: string | null;
    invitationType?: 'organization' | 'staff';
}

const SignupForm: React.FC<SignupFormProps> = ({
    onSubmit,
    invitationToken,
    invitationType = 'organization'
}) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const dispatch = useDispatch();

    // Use RTK Query mutation hook
    const [registerOrg, { isLoading: isRegistering }] = useRegisterWithOrgInvitationMutation();
    const [registerStaff, { isLoading: isStaffRegistering }] = useRegisterWithStaffInvitationMutation();
    const [registerUser] = useRegisterMutation();

    // Mobile detection
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);


    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
        trigger
    } = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            gender: '',
            phone: '',
            countryCode: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            },
        },
        mode: 'onChange'
    });

    const password = watch('password');
    const stepTitles = ['Personal', 'Account', 'Contact', 'Address'];

    // Form submission handler
    const onSubmitForm = async (data: any) => {
        if (!invitationToken) {
            setErrorMessage('Invalid invitation token. Please use the link from your invitation email.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            // Determine the endpoint based on invitation type
            const endpoint = invitationType === 'staff'
                ? 'register-with-staff-invitation'
                : 'register-with-invitation';

            // Use RTK Query mutation
            // const response = await registerUser({
            //     ...data,
            //     token: invitationToken,
            //     type: invitationType
            // }).unwrap();

            if (invitationType === 'staff') {
                const response = await registerStaff({
                    ...data,
                    token: invitationToken,
                    type: invitationType
                }).unwrap();

                // Store token in Redux
                dispatch(setCredentials({
                    token: response.token,
                    user: response.user
                }));

                // Call the onSubmit callback with the response data
                onSubmit(response);
            }
            else {
                const response = await registerOrg({
                    ...data,
                    token: invitationToken,
                    type: invitationType
                }).unwrap();
                // Store token in Redux
                dispatch(setCredentials({
                    token: response.token,
                    user: response.user
                }));

                // Call the onSubmit callback with the response data
                onSubmit(response);
            }



        } catch (error: any) {
            setErrorMessage(error.data?.message || error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Step navigation with validation
    const nextStep = async () => {
        const fields = {
            0: ['firstName', 'lastName', 'gender'],
            1: ['email', 'password', 'confirmPassword'],
            2: ['phone', 'countryCode'],
            3: [
                'address.street',
                'address.city',
                'address.state',
                'address.zipCode',
                'address.country',
            ],
        };

        setErrorMessage('');
        const isStepValid = await trigger(fields[step as keyof typeof fields] as any);
        if (isStepValid) {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        setErrorMessage('');
        setStep((prev) => prev - 1);
    };

    // Helper components
    const renderErrorMessage = () => {
        if (!errorMessage) return null;
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        );
    };

    const ActionButtons = ({ isLastStep = false }: { isLastStep?: boolean }) => (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-2">
            <Button
                variant="outline"
                onClick={step === 0 ? () => navigate('/auth/login') : prevStep}
                className="text-sm w-full sm:w-auto order-2 sm:order-1"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {step === 0 ? (isMobile ? 'Login' : 'Back to Login') : 'Back'}
            </Button>

            <div className="flex gap-3 sm:gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button
                    onClick={isLastStep ? handleSubmit(onSubmitForm) : nextStep}
                    disabled={loading || isRegistering}
                    className="flex-1 sm:flex-initial min-w-[100px]"
                >
                    {(loading || isRegistering) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLastStep ? (
                        'Complete'
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    // Form Steps
    const steps = [
        // Step 1: Personal Info
        <motion.div
            key="personal"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            {/* Content remains the same */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Tell us about yourself</h2>
                <p className="text-muted-foreground">
                    Please provide your personal information
                </p>
            </div>

            {renderErrorMessage()}

            {/* Form fields remain the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{ required: 'First name is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="firstName"
                                placeholder="First Name"
                                className={errors.firstName ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.firstName && (
                        <p className="text-sm text-destructive">
                            {errors.firstName.message}
                        </p>
                    )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Controller
                        name="lastName"
                        control={control}
                        rules={{ required: 'Last name is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="lastName"
                                placeholder="Last Name"
                                className={errors.lastName ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.lastName && (
                        <p className="text-sm text-destructive">
                            {errors.lastName.message}
                        </p>
                    )}
                </div>

                {/* Gender */}
                <div className="col-span-full space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Controller
                        name="gender"
                        control={control}
                        rules={{ required: 'Gender is required' }}
                        render={({ field: { value, onChange } }) => (
                            <Select value={value} onValueChange={onChange}>
                                <SelectTrigger
                                    className={errors.gender ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    {genderOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.gender && (
                        <p className="text-sm text-destructive">{errors.gender.message}</p>
                    )}
                </div>
            </div>
            <ActionButtons />
        </motion.div>,

        // Step 2: Account Setup
        <motion.div
            key="account"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Create your account</h2>
                <p className="text-muted-foreground">Set up your login credentials</p>
            </div>

            {renderErrorMessage()}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="email"
                                type="email"
                                placeholder="Email"
                                className={errors.email ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Controller
                        name="password"
                        control={control}
                        rules={{
                            required: 'Password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="password"
                                type="password"
                                placeholder="Password"
                                className={errors.password ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Controller
                        name="confirmPassword"
                        control={control}
                        rules={{
                            required: 'Please confirm your password',
                            validate: (value) =>
                                value === password || 'The passwords do not match',
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm Password"
                                className={errors.confirmPassword ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>
            </div>
            <ActionButtons />
        </motion.div>,

        // Step 3: Contact Information
        <motion.div
            key="contact"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Contact Information</h2>
                <p className="text-muted-foreground">
                    How can we reach you?
                </p>
            </div>

            {renderErrorMessage()}

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Controller
                        name="countryCode"
                        control={control}
                        rules={{ required: 'Country code is required' }}
                        render={({ field: { value, onChange } }) => (
                            <Select value={value} onValueChange={onChange}>
                                <SelectTrigger
                                    className={errors.countryCode ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Code" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countryCodes.map((country) => (
                                        <SelectItem key={country.code} value={country.code}>
                                            {`${country.country} (${country.code})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.countryCode && (
                        <p className="text-sm text-destructive">
                            {errors.countryCode.message}
                        </p>
                    )}
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Controller
                        name="phone"
                        control={control}
                        rules={{
                            required: 'Phone number is required',
                            pattern: {
                                value: /^[0-9]{7,15}$/,
                                message: 'Invalid phone number',
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="phone"
                                placeholder="Phone Number"
                                className={errors.phone ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                </div>
            </div>
            <ActionButtons />
        </motion.div>,

        // Step 4: Address
        <motion.div
            key="address"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Your Address</h2>
                <p className="text-muted-foreground">
                    Please provide your current address
                </p>
            </div>

            {renderErrorMessage()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Controller
                        name="address.street"
                        control={control}
                        rules={{ required: 'Street address is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="street"
                                placeholder="Street Address"
                                className={errors.address?.street ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.address?.street && (
                        <p className="text-sm text-destructive">
                            {errors.address.street.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Controller
                        name="address.city"
                        control={control}
                        rules={{ required: 'City is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="city"
                                placeholder="City"
                                className={errors.address?.city ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.address?.city && (
                        <p className="text-sm text-destructive">
                            {errors.address.city.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">Region</Label>
                    <Controller
                        name="address.state"
                        control={control}
                        rules={{ required: 'Region is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="state"
                                placeholder="e.g. Greater London, Kent, Essex"
                                className={errors.address?.state ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.address?.state && (
                        <p className="text-sm text-destructive">
                            {errors.address.state.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="zipCode">Postcode</Label>
                    <Controller
                        name="address.zipCode"
                        control={control}
                        rules={{ required: 'Postal code is required' }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="zipCode"
                                placeholder="Postcode"
                                className={errors.address?.zipCode ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.address?.zipCode && (
                        <p className="text-sm text-destructive">
                            {errors.address.zipCode.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Controller
                        name="address.country"
                        control={control}
                        rules={{ required: 'Country is required' }}
                        render={({ field: { value, onChange } }) => (
                            <Select
                                value={value}
                                onValueChange={onChange}
                            >
                                <SelectTrigger
                                    className={
                                        errors.address?.country ? 'border-destructive' : ''
                                    }
                                >
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.code} value={country.code}>
                                            {country.name} ({country.currency})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.address?.country && (
                        <p className="text-sm text-destructive">
                            {errors.address.country.message}
                        </p>
                    )}
                </div>
            </div>
            <ActionButtons isLastStep={true} />
        </motion.div>,
    ];

    return (
        <div className="w-full p-4">
            <Card className="backdrop-blur-sm bg-background w-full">
                <CardContent className="p-4 sm:p-6 w-full">
                    {/* Progress Stepper */}
                    <StepIndicator currentStep={step} steps={stepTitles} />

                    {/* Progress bar */}
                    <Progress
                        value={(step / (steps.length - 1)) * 100}
                        className="h-2 mb-8"
                    />

                    {/* Form Steps */}
                    <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
};

export default SignupForm;