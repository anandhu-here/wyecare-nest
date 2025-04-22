// libs/web/features/src/lib/organizations/components/CreateOrganization.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// Icons
import {
    Briefcase,
    Mail,
    MapPin,
    Loader2,
    Building,
    Users,
    Check
} from 'lucide-react';
import { useCreateOrganizationMutation } from '@/app/features/organization/organizationApi';

const countryCodes = [
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
];

const CreateOrganization: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [useUserAddress, setUseUserAddress] = useState(false);
    const navigate = useNavigate();

    // User data from localStorage
    const [userData, setUserData] = useState<any>(null);

    // Get user data on component mount
    useEffect(() => {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            setUserData(JSON.parse(userDataString));
        }
    }, []);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm({
        defaultValues: {
            name: '',
            type: '',
            staffsRange: '',
            residentsRange: '',
            residentManagementEnabled: false,
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

    const watchedAddress = watch('address');
    const watchOrgType = watch('type');
    const watchResidentManagement = watch('residentManagementEnabled');
    const [createOrganization, { isLoading: isCreatingOrg }] = useCreateOrganizationMutation();


    // Handle using user address for organization
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

    const onSubmit = async (data: any) => {
        try {
            setErrorMessage('');
            setSuccessMessage('');

            // Replace fetch with RTK mutation
            const response = await createOrganization({
                ...data,
                phone: data.phoneNumber,
                ownerId: userData?._id,
                countryMetadata: userData?.countryMetadata || {},
            }).unwrap();

            setSuccessMessage('Organization created successfully!');

            // Navigate to dashboard after short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error: any) {
            setErrorMessage(
                error.data?.message || error.message || 'Organization creation failed. Please try again.'
            );
        }
    };
    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create Your Organization</CardTitle>
                    <CardDescription>
                        Set up your organization to get started. This will be your workspace for managing staff and resources.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {errorMessage && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert className="mb-6 bg-green-50 border-green-500 text-green-700">
                            <Check className="h-4 w-4 mr-2" />
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>

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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger
                                                id="type"
                                                className={errors.type ? 'border-destructive' : ''}
                                            >
                                                <SelectValue placeholder="Select organization type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="agency">Agency</SelectItem>
                                                <SelectItem value="home">Home</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.type && (
                                    <p className="text-sm text-destructive">{errors.type.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Management Details */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">Management Details</h3>

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

                            {watchOrgType === 'home' && (
                                <div className="flex items-center space-x-2">
                                    <Controller
                                        name="residentManagementEnabled"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="residentManagementEnabled"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Label htmlFor="residentManagementEnabled">
                                        Enable resident management for your care home
                                    </Label>
                                </div>
                            )}

                            {watchOrgType === 'home' && watchResidentManagement && (
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="residentsRange">Residents Range</Label>
                                        <span className="ml-2 text-xs text-amber-600">(Coming Soon)</span>
                                    </div>
                                    <Controller
                                        name="residentsRange"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled
                                            >
                                                <SelectTrigger id="residentsRange">
                                                    <SelectValue placeholder="Select residents range" />
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
                                        Resident management features will be available in an upcoming update.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">Contact Information</h3>

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

                        {/* Address Information */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-medium">Address Information</h3>

                            <div className="mb-4 flex items-center space-x-2">
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
                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-end space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Organization'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default CreateOrganization;