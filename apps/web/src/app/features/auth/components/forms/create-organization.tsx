// libs/web/features/src/lib/organizations/components/CreateOrganization.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { selectUser } from '../../AuthSlice';


const countryCodes = [
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
];

// Organization categories
const organizationCategories = [
    { value: 'care_home', label: 'Care Home' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'education', label: 'Educational Institution' },
    { value: 'healthcare', label: 'Healthcare Provider' },
    { value: 'social_services', label: 'Social Services' },
    { value: 'retail', label: 'Retail' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'other', label: 'Other' }
];

const CreateOrganization: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [useUserAddress, setUseUserAddress] = useState(false);
    const [predefinedCategory, setPredefinedCategory] = useState<string | null>(null);
    const navigate = useNavigate();

    // Get user data from Redux state
    const user = useSelector(selectUser);

    // Get predefined category on component mount
    useEffect(() => {
        // Check for category in URL params (might be passed as 'type' from older parts of the app)
        const categoryParam = searchParams.get('type') || searchParams.get('category');
        if (categoryParam) {
            setPredefinedCategory(categoryParam);
        }
    }, [searchParams]);

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
            category: '',
            staffsRange: '',
            subjectsRange: '',
            subjectManagementEnabled: false,
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
            },
            countryCode: '',
            phoneNumber: '',
            email: user?.email || '',
        },
        mode: 'onChange',
    });

    // Apply predefined category if available
    useEffect(() => {
        if (predefinedCategory) {
            setValue('category', predefinedCategory);
        }

        // Pre-fill email from user data
        if (user?.email) {
            setValue('email', user.email);
        }
    }, [predefinedCategory, user, setValue]);

    const watchedAddress = watch('address');
    const watchCategory = watch('category');
    const watchSubjectManagement = watch('subjectManagementEnabled');
    const [createOrganization, { isLoading: isCreatingOrg }] = useCreateOrganizationMutation();

    // Handle using user address from Redux state
    useEffect(() => {
        if (useUserAddress && user?.address) {
            setValue('address', user.address);
            setValue('countryCode', user.countryCode || '');
            setValue('phoneNumber', user.phone || '');
        }
    }, [useUserAddress, user, setValue]);

    const handleUseUserAddress = (checked: boolean) => {
        setUseUserAddress(checked);
        if (checked && user?.address) {
            setValue('address', user.address);
            setValue('countryCode', user.countryCode || '');
            setValue('phoneNumber', user.phone || '');
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
        }
    };

    // Get subject label based on organization category
    const getSubjectLabel = () => {
        switch (watchCategory) {
            case 'care_home': return 'Resident';
            case 'hospital': return 'Patient';
            case 'education': return 'Student';
            case 'healthcare': return 'Patient';
            case 'social_services': return 'Client';
            default: return 'Subject';
        }
    };

    // Check if category supports subject management
    const categorySupportsSubjects = () => {
        return ['care_home', 'hospital', 'education', 'healthcare', 'social_services'].includes(watchCategory);
    };

    const onSubmit = async (data: any) => {
        try {
            setErrorMessage('');
            setSuccessMessage('');
            setIsSubmitting(true);

            // Ensure category is set
            if (!data.category) {
                setErrorMessage('Organization category is required');
                setIsSubmitting(false);
                return;
            }

            // Replace fetch with RTK mutation
            const response = await createOrganization({
                ...data,
                phone: data.phoneNumber,
                ownerId: user?._id,
                countryMetadata: user?.countryMetadata || {},
            }).unwrap();

            setSuccessMessage('Organization created successfully!');

            // Navigate to dashboard after short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error: any) {
            console.error('Organization creation error:', error);
            setErrorMessage(
                error.data?.message || error.message || 'Organization creation failed. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
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
                                <Label htmlFor="category">Organization Category</Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    rules={{ required: 'Organization category is required' }}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!!predefinedCategory}
                                        >
                                            <SelectTrigger
                                                id="category"
                                                className={errors.category ? 'border-destructive' : ''}
                                            >
                                                <SelectValue placeholder="Select organization category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizationCategories.map(category => (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        {category.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.category && (
                                    <p className="text-sm text-destructive">{errors.category.message}</p>
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

                            {categorySupportsSubjects() && (
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
                                        Enable {getSubjectLabel().toLowerCase()} management for your {watchCategory.replace('_', ' ')}
                                    </Label>
                                </div>
                            )}

                            {categorySupportsSubjects() && watchSubjectManagement && (
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="subjectsRange">{getSubjectLabel()} Range</Label>
                                        <span className="ml-2 text-xs text-amber-600">(Coming Soon)</span>
                                    </div>
                                    <Controller
                                        name="subjectsRange"
                                        control={control}
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
                                            disabled={!user?.address}
                                        />
                                    )}
                                />
                                <Label htmlFor="useUserAddress">
                                    Use my personal address
                                    {!user?.address && <span className="ml-2 text-xs text-muted-foreground">(No address found in your profile)</span>}
                                </Label>
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
                        disabled={isSubmitting || isCreatingOrg}
                    >
                        {(isSubmitting || isCreatingOrg) ? (
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