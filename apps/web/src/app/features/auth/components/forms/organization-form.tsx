import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase,
    Mail,
    MapPin,
    ArrowLeft,
    ChevronRight,
    Loader2,
    Building,
    Users
} from 'lucide-react';
import StepIndicator from '../step-indicator';
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};
const pageTransition = {
    duration: 0.5,
    ease: 'easeInOut',
};
const countryCodes = [
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
];
const organizationTypes = [
    { value: 'care_home', label: 'Care Home' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'education', label: 'Educational Institution' },
    { value: 'healthcare', label: 'Healthcare Provider' },
    { value: 'social_services', label: 'Social Services' },
    { value: 'retail', label: 'Retail' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'other', label: 'Other' }
];
interface OrganizationFormProps {
    onSubmit: (data: any) => void;
    predefinedOrgType?: string | null;
}
const OrganizationForm: React.FC<OrganizationFormProps> = ({
    onSubmit,
    predefinedOrgType = null
}) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [useUserAddress, setUseUserAddress] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            setUserData(JSON.parse(userDataString));
        }
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        trigger,
    } = useForm({
        defaultValues: {
            name: '',
            type: predefinedOrgType || '',
            staffsRange: '',
            subjectManagementEnabled: false,
            subjectsRange: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            },
            countryCode: '',
            phoneNumber: '',
            email: '',
        },
        mode: 'onChange',
    });
    useEffect(() => {
        if (predefinedOrgType) {
            setValue('type', predefinedOrgType);
        }
    }, [predefinedOrgType, setValue]);
    const watchedAddress = watch('address');
    const watchOrgType = watch('type');
    const watchSubjectManagement = watch('subjectManagementEnabled');
    useEffect(() => {
        if (useUserAddress && userData?.address) {
            setValue('address', userData.address);
            setValue('countryCode', userData.countryCode || '');
            setValue('phoneNumber', userData.phone || '');
            setValue('email', userData.email || '');
        }
    }, [useUserAddress, userData, setValue]);
    const handleUseUserAddress = (checked: boolean) => {
        setUseUserAddress(checked);
        if (checked && userData?.address) {
            setValue('address', userData.address);
            setValue('countryCode', userData.countryCode || '');
            setValue('phoneNumber', userData.phone || '');
            setValue('email', userData.email || '');
        } else {
            setValue('address', {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            });
            setValue('countryCode', '');
            setValue('phoneNumber', '');
            setValue('email', '');
        }
    };
    const onFormSubmit = async (data: any) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setErrorMessage('Authentication token is missing. Please log in again.');
                return;
            }
            setIsSubmitting(true);
            setErrorMessage('');
            const response = await fetch('/api/v1/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    phone: data.phoneNumber,
                    ownerId: userData?._id,
                    countryMetadata: userData?.countryMetadata || {},
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Organization creation failed');
            }
            const responseData = await response.json();
            onSubmit(responseData);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Organization creation failed. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleNext = async () => {
        const fields = {
            0: ['name', 'type'],
            1: [
                'staffsRange',
                ...(['care_home', 'hospital', 'education'].includes(watchOrgType) ? ['subjectManagementEnabled'] : []),
                ...(watchSubjectManagement ? ['subjectsRange'] : []),
            ],
            2: ['email', 'countryCode', 'phoneNumber'],
            3: [
                'address.street',
                'address.city',
                'address.state',
                'address.zipCode',
                'address.country',
            ],
        };
        setErrorMessage('');
        const isStepValid = await trigger(fields[step as keyof typeof fields]);
        if (isStepValid) {
            setStep((prev) => prev + 1);
        }
    };
    const handleBack = () => {
        setErrorMessage('');
        setStep((prev) => prev - 1);
    };
    const stepTitles = ['Info', 'Management', 'Contact', 'Address'];
    const renderErrorMessage = () => {
        if (!errorMessage) return null;
        return (
            <Alert variant="destructive" className="mb-6">
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        );
    };
    const getSubjectLabel = () => {
        switch (watchOrgType) {
            case 'care_home': return 'Resident';
            case 'hospital': return 'Patient';
            case 'education': return 'Student';
            case 'healthcare': return 'Patient';
            case 'social_services': return 'Client';
            default: return 'Subject';
        }
    };
    const ActionButtons = ({ isLastStep = false }: { isLastStep?: boolean }) => (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-2">
            <Button
                variant="outline"
                onClick={handleBack}
                className="text-sm w-full sm:w-auto order-2 sm:order-1"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <div className="flex gap-3 sm:gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button
                    onClick={isLastStep ? handleSubmit(onFormSubmit) : handleNext}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial min-w-[100px]"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLastStep ? (
                        'Create Organization'
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
    const steps = [
        <motion.div
            key="basic"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Basic Information</h2>
                <p className="text-muted-foreground">
                    Let's start with your organization's basic details
                </p>
            </div>
            {renderErrorMessage()}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Organization name is required' }}
                        render={({ field }) => (
                            <Input
                                id="name"
                                {...field}
                                placeholder="Enter organization name"
                                className={errors.name ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Organization Type</Label>
                    <Controller
                        name="type"
                        control={control}
                        rules={{ required: 'Organization type is required' }}
                        render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={!!predefinedOrgType}
                            >
                                <SelectTrigger
                                    id="type"
                                    className={errors.type ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Select organization type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizationTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.type && (
                        <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                </div>
            </div>
            <ActionButtons />
        </motion.div>,
        <motion.div
            key="management"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Management Details</h2>
                <p className="text-muted-foreground">
                    Tell us about your organization's capacity
                </p>
            </div>
            {renderErrorMessage()}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="staffsRange">Staff Range</Label>
                    <Controller
                        name="staffsRange"
                        control={control}
                        rules={{ required: 'Staff range is required' }}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger
                                    id="staffsRange"
                                    className={errors.staffsRange ? 'border-destructive' : ''}
                                >
                                    <SelectValue placeholder="Select staff range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-10">1-10</SelectItem>
                                    <SelectItem value="11-50">11-50</SelectItem>
                                    <SelectItem value="51-200">51-200</SelectItem>
                                    <SelectItem value="201-500">201-500</SelectItem>
                                    <SelectItem value="500+">500+</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.staffsRange && (
                        <p className="text-sm text-destructive">
                            {errors.staffsRange.message}
                        </p>
                    )}
                </div>
                {['care_home', 'hospital', 'education'].includes(watchOrgType) && (
                    <div className="flex items-center space-x-2">
                        <Controller
                            name="subjectManagementEnabled"
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    id="subjectManagementEnabled"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="subjectManagementEnabled">
                            Enable {getSubjectLabel().toLowerCase()} management for your {watchOrgType.replace('_', ' ')}
                        </Label>
                    </div>
                )}
                {['care_home', 'hospital', 'education'].includes(watchOrgType) && watchSubjectManagement && (
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Label htmlFor="subjectsRange">{getSubjectLabel()} Range</Label>
                            <span className="ml-2 text-xs text-amber-600">(Coming Soon)</span>
                        </div>
                        <Controller
                            name="subjectsRange"
                            control={control}
                            rules={{}}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled
                                >
                                    <SelectTrigger id="subjectsRange">
                                        <SelectValue placeholder={`Select ${getSubjectLabel().toLowerCase()} range`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10</SelectItem>
                                        <SelectItem value="11-50">11-50</SelectItem>
                                        <SelectItem value="51-100">51-100</SelectItem>
                                        <SelectItem value="101-200">101-200</SelectItem>
                                        <SelectItem value="200+">200+</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <p className="text-sm text-muted-foreground">
                            {getSubjectLabel()} management features will be available in an upcoming update.
                        </p>
                    </div>
                )}
            </div>
            <ActionButtons />
        </motion.div>,
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
                    How can people reach your organization?
                </p>
            </div>
            {renderErrorMessage()}
            <div className="space-y-6">
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
                                id="email"
                                type="email"
                                placeholder="organization@example.com"
                                {...field}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                        )}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="countryCode">Country Code</Label>
                        <Controller
                            name="countryCode"
                            control={control}
                            rules={{ required: 'Country code is required' }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger
                                        id="countryCode"
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
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Controller
                            name="phoneNumber"
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
                                    id="phoneNumber"
                                    placeholder="Phone Number"
                                    {...field}
                                    className={errors.phoneNumber ? 'border-destructive' : ''}
                                />
                            )}
                        />
                        {errors.phoneNumber && (
                            <p className="text-sm text-destructive">
                                {errors.phoneNumber.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <ActionButtons />
        </motion.div>,
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
                <h2 className="text-2xl font-semibold">Address Information</h2>
                <p className="text-muted-foreground">
                    Where is your organization located?
                </p>
            </div>
            {renderErrorMessage()}
            <div className="mb-6 flex items-center space-x-2">
                <Controller
                    name="useUserAddress"
                    control={control}
                    render={() => (
                        <Checkbox
                            id="useUserAddress"
                            checked={useUserAddress}
                            onCheckedChange={handleUseUserAddress}
                        />
                    )}
                />
                <Label htmlFor="useUserAddress">Use my personal address</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full space-y-2">
                    <Label htmlFor="address.street">Street Address</Label>
                    <Controller
                        name="address.street"
                        control={control}
                        rules={{ required: 'Street address is required' }}
                        render={({ field }) => (
                            <Input
                                id="address.street"
                                placeholder="Street Address"
                                {...field}
                                value={watchedAddress.street}
                                disabled={useUserAddress}
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
                    <Label htmlFor="address.city">City</Label>
                    <Controller
                        name="address.city"
                        control={control}
                        rules={{ required: 'City is required' }}
                        render={({ field }) => (
                            <Input
                                id="address.city"
                                placeholder="City"
                                {...field}
                                value={watchedAddress.city}
                                disabled={useUserAddress}
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
                    <Label htmlFor="address.state">Region</Label>
                    <Controller
                        name="address.state"
                        control={control}
                        rules={{ required: 'Region is required' }}
                        render={({ field }) => (
                            <Input
                                id="address.state"
                                placeholder="e.g. Greater London, Kent, Essex"
                                {...field}
                                value={watchedAddress.state}
                                disabled={useUserAddress}
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
                    <Label htmlFor="address.zipCode">Postcode</Label>
                    <Controller
                        name="address.zipCode"
                        control={control}
                        rules={{ required: 'Postal code is required' }}
                        render={({ field }) => (
                            <Input
                                id="address.zipCode"
                                placeholder="Postcode"
                                {...field}
                                value={watchedAddress.zipCode}
                                disabled={useUserAddress}
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
                    <Label htmlFor="address.country">Country</Label>
                    <Controller
                        name="address.country"
                        control={control}
                        rules={{ required: 'Country is required' }}
                        render={({ field }) => (
                            <Input
                                id="address.country"
                                placeholder="Country"
                                {...field}
                                value={watchedAddress.country}
                                disabled={useUserAddress}
                                className={errors.address?.country ? 'border-destructive' : ''}
                            />
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
                    {}
                    <StepIndicator currentStep={step} steps={stepTitles} />
                    {}
                    <Progress
                        value={(step / (steps.length - 1)) * 100}
                        className="h-2 mb-8"
                    />
                    {}
                    <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
};
export default OrganizationForm;