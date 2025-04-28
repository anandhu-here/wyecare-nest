import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Mail,
    Phone,
    MapPin,
    Briefcase,
    User,
    Edit2,
    AlertCircle,
    Navigation,
    X,
    Save,
    Camera,
    CalendarIcon
} from 'lucide-react';
import { application } from 'express';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IEmployeeApplication } from '@wyecare-monorepo/shared-types';
import { employeeApplicationApi, useUpdateSectionMutation } from '../employeeApplicationApi';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../auth/AuthSlice';
import { apiHostname } from '@/config/api';
import { toast } from 'react-toastify';
import CircularLoader from '@/components/circular-loader';
import { cn } from '@/lib/util';
import axios from 'axios';

interface PersonalInformationProps {
    initialData?: IEmployeeApplication['personalInfo'];
    onSubmit: (data: any, index: number, section: string, userId?: string) => void;
    selectedSection: string;
    userId?: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({
    initialData,
    onSubmit,
    userId,
    isViewedByYourOrg = false,
    editable = true
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showEditButton, setShowEditButton] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [profilePicture, setProfilePicture] = useState(initialData?.avatarUrl);
    const [isMobile, setIsMobile] = useState(false);
    const [updateApplicationSection] = useUpdateSectionMutation();

    const userState = useSelector(selectUser);
    const dispatch = useDispatch();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty }
    } = useForm<IEmployeeApplication['personalInfo']>({
        defaultValues: {
            ...initialData,
            gender: initialData?.gender || 'Prefer not to say',
            dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : null as any,
            summary: initialData?.summary || '',
            address: initialData?.address || {},
            emergencyContact: initialData?.emergencyContact || {},
            jobTitle: initialData?.jobTitle || 'Health Care Assistant',
        }
    });

    const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        const fileExtension = file.name.substr(file.name.lastIndexOf('.'));
        const newFileName = `profile_picture_${userState?._id}_${Date.now()}${fileExtension}`;
        const renamedFile = new File([file], newFileName, { type: file.type });
        formData.append('file', renamedFile);

        try {
            console.log('Uploading profile picture...');
            const response = await axios.post(
                `${apiHostname}/api/v1/pictures/${userState?._id}/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data) {
                toast.success('Profile picture updated successfully!');
                setProfilePicture(response.data?.data?.avatarUrl);
                // dispatch(_setAvatar(response.data?.data?.avatarUrl));
                dispatch(employeeApplicationApi.util.invalidateTags(['Application']));
            } else {
                throw new Error(response.data.error || 'Failed to update profile picture');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile picture');
            console.error('Profile picture upload error:', error);

        } finally {
            setIsUploading(false);
        }
    };

    const onSubmitForm = async (data: IEmployeeApplication['personalInfo']) => {
        try {
            const response = await updateApplicationSection({
                carerId: userId,
                section: 'personalInfo',
                data: {
                    ...data,
                    email: data.email?.trim().toLowerCase(), // Normalize email before sending
                    dateOfBirth: data.dateOfBirth?.toISOString(),
                    avatarUrl: profilePicture
                }
            }).unwrap();

            if (editable) {
                setIsEditing(false);
                setShowEditButton(true);
            }

            toast.success('Personal information updated successfully!');

        } catch (error: any) {
            // Handle duplicate email error
            if (error?.data?.message?.includes('email already exists')) {
                toast.error('This email is already in use');

                // Set form error
                control.setError('email', {
                    type: 'manual',
                    message: 'This email is already in use'
                });
            } else {
                toast.error('Failed to update personal information');
            }
            console.error('Form submission error:', error);
        }
    };

    const ProfileView = () => {
        const formValues = control._formValues;

        return (
            <div className="p-2 bg-gray-50">
                {/* Profile Header */}
                <div className="relative rounded-2xl overflow-hidden mb-8">

                    <div className="w-full px-0 sm:px-6 lg:px-8 py-6">
                        <div className="max-w-7xl mx-auto">
                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-lg p-6 shadow-sm">
                                {/* Profile Picture */}
                                <div className="shrink-0">
                                    <div className="relative">
                                        <input
                                            accept="image/*"
                                            className="hidden"
                                            id="profile-picture-upload-personal"
                                            type="file"
                                            onChange={handleProfilePictureUpload}
                                            disabled={!editable}
                                        />
                                        <label htmlFor="profile-picture-upload-personal">
                                            <div className={`relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200
              ${editable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
                                                <>
                                                    {
                                                        isUploading ? (
                                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                <CircularLoader />
                                                            </div>
                                                        ) : (
                                                            <Avatar
                                                                className=" w-full h-full object-cover"
                                                            >
                                                                {profilePicture ? (
                                                                    <AvatarImage src={profilePicture} alt="Profile Picture" className='object-cover' />
                                                                ) : (
                                                                    <AvatarFallback className="bg-gray-100 text-gray-400" />
                                                                )}
                                                            </Avatar>
                                                        )
                                                    }
                                                </>
                                                {editable && (
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <Camera className="w-6 h-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 flex-grow">
                                    <div className="text-center sm:text-left">
                                        <h1 className="text-sm sm:text-2xl font-semibold text-gray-900">
                                            {formValues.title} {formValues.firstName} {formValues.lastName}
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            {formValues.jobTitle}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                                            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                                <Mail className="w-4 h-4" />
                                                {formValues.email}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                                <Phone className="w-4 h-4" />
                                                {formValues.phone}
                                            </span>
                                        </div>
                                    </div>

                                    {(editable || isViewedByYourOrg) && (
                                        <button
                                            onClick={() => {
                                                setIsEditing(!isEditing);
                                                setShowEditButton(!showEditButton);
                                            }}
                                            className={`shrink-0 px-4 py-2 rounded-md flex items-center gap-2 border transition-colors
              ${isEditing
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {isEditing ? (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    <span>Cancel</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Edit2 className="w-4 h-4" />
                                                    <span>Edit Profile</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto -mt-6 px-0 sm:px-6 md:px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="md:col-span-7">
                            <div className="bg-white rounded-xl shadow-md p-8 transition hover:-translate-y-1 hover:shadow-lg">
                                <h3 className="text-sm font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-primary-500 inline-block">
                                    Personal Details
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <span className="text-sm text-gray-500">Full Name</span>
                                        <p className="text-gray-900 font-medium">
                                            {formValues.title} {formValues.firstName} {formValues.middleName} {formValues.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Date of Birth</span>
                                        <p className="text-gray-900 font-medium">
                                            {formValues.dateOfBirth
                                                ? new Date(formValues.dateOfBirth).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Gender</span>
                                        <p className="text-gray-900 font-medium">{formValues.gender}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">National Insurance</span>
                                        <p className="text-gray-900 font-medium">{formValues.nationalInsuranceNumber}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 my-8" />

                                <h3 className="text-sm font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-primary-500 inline-block">
                                    Contact Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Phone className="w-4 h-4 text-primary-500" />
                                            <span className="text-sm text-gray-500">Phone Number</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{formValues.phone}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail className="w-4 h-4 text-primary-500" />
                                            <span className="text-sm text-gray-500">Email</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{formValues.email}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 my-8" />

                                <h3 className="text-sm font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-primary-500 inline-block">
                                    Address Information
                                </h3>

                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-primary-50 border-b border-gray-200 p-6 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                                            <Navigation className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-primary-600">
                                                Current Address
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Primary Residential Location
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <span className="text-sm text-gray-500">Street Address</span>
                                                <p className="text-gray-900">{formValues.address?.street}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">City</span>
                                                <p className="text-gray-900">{formValues.address?.city}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">County</span>
                                                <p className="text-gray-900">{formValues.address?.county}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Postcode</span>
                                                <p className="text-gray-900 uppercase">{formValues.address?.zipCode}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <span className="text-sm text-gray-500">Country</span>
                                                <p className="text-gray-900">{formValues.address?.country}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-gray-200 flex items-start gap-4">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            <p className="text-gray-600 leading-relaxed">
                                                {formValues.address?.street},
                                                {' '}{formValues.address?.city},
                                                {' '}{formValues.address?.county},
                                                {' '}{formValues.address?.zipCode},
                                                {' '}{formValues.address?.country}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="md:col-span-5">
                            <div className="space-y-6">
                                {/* Personal Summary Card */}
                                <div className="bg-white rounded-xl shadow-md p-8 transition hover:-translate-y-1 hover:shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <User className="w-6 h-6 text-primary-500" />
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Personal Summary
                                        </h3>
                                    </div>
                                    <p className={`text-gray-600 leading-relaxed pl-10 
                    ${!formValues.summary && 'italic'}`}>
                                        {formValues.summary || 'No personal summary provided yet.'}
                                    </p>
                                </div>

                                {/* Emergency Contact Card */}
                                <div className="bg-red-50 rounded-xl shadow-md p-8 border-l-4 border-red-500">
                                    <div className="flex items-center gap-4 mb-6">
                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Emergency Contact
                                        </h3>
                                    </div>
                                    <div className="pl-10 space-y-4">
                                        <div>
                                            <span className="text-sm text-gray-500">Name</span>
                                            <p className="text-gray-900 font-medium">
                                                {formValues.emergencyContact?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Relationship</span>
                                            <p className="text-gray-900 font-medium">
                                                {formValues.emergencyContact?.relationship}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Contact Number</span>
                                            <p className="text-gray-900 font-medium">
                                                {formValues.emergencyContact?.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Info Card */}
                                <div className="bg-white rounded-xl shadow-md p-8 transition hover:-translate-y-1 hover:shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <Briefcase className="w-6 h-6 text-primary-500" />
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Professional Info
                                        </h3>
                                    </div>
                                    <div className="pl-10 space-y-4">
                                        <div>
                                            <span className="text-sm text-gray-500">Current Position</span>
                                            <p className="text-gray-900 font-medium">{formValues.jobTitle}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Department</span>
                                            <p className="text-gray-900 font-medium">Healthcare Services</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const FormField = ({ label, error, children }: {
        label: string;
        error?: any;
        children: React.ReactNode;
    }) => (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
        </div>
    );

    const renderField = (name: string, label: string, rules = {}, options = {}) => {
        return (
            <Controller
                name={name as any}
                control={control}
                rules={{}} // Remove all validation rules to allow partial saves
                render={({ field }) => {
                    return (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                            </label>
                            <input
                                {...field}
                                type='text'
                                className="w-full px-4 py-2 rounded-lg border border-gray-300
                  focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-all duration-200 hover:translate-y-px"
                                {...options}
                            />
                        </>
                    );
                }}
            />
        );
    };

    // Replace the existing renderDateField with this:
    const renderDateField = (name: string, label: string) => {
        return (
            <Controller
                name={name as any}
                control={control}
                render={({ field, fieldState: { error } }) => (
                    <div className="flex flex-col gap-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {label}
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full pl-3 text-left font-normal justify-between",
                                        !field.value && "text-muted-foreground",
                                        error && "border-red-500"
                                    )}
                                >
                                    {field.value ? (
                                        format(new Date(field.value), "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    captionLayout="dropdown"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear()}
                                    classNames={{
                                        day_hidden: "invisible",
                                        dropdown: "px-2 py-1.5 rounded-md bg-popover text-popover-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                                        caption_dropdowns: "flex gap-3",
                                        vhidden: "hidden",
                                        caption_label: "hidden",
                                    }}

                                />
                            </PopoverContent>
                        </Popover>
                        {error && (
                            <span className="text-sm text-red-500">{error.message}</span>
                        )}
                    </div>
                )}
            />
        );
    };

    const renderSelect = (
        name: string,
        label: string,
        options: { value: string; label: string }[]
    ) => (
        <Controller
            name={name as any}
            control={control}
            rules={{}} // Remove validation rules
            render={({ field }) => (
                <FormField label={label} error={null}> {/* Remove error display */}
                    <select
                        {...field}
                        className="w-full h-10 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all duration-200 hover:translate-y-px"
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>
            )}
        />
    );

    return (
        <div className="min-h-screen pb-10">
            <form onSubmit={handleSubmit(onSubmitForm)}>
                {isEditing ? (
                    <div className="max-w-7xl mx-auto p-4 transition-all duration-300">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 p-4">
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Edit Personal Information
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Summary Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary-600 mb-6">
                                    Summary
                                </h3>
                                {renderField('summary', 'Personal Summary', {}, {
                                    multiline: true,
                                    placeholder: 'Share a brief summary about yourself...'
                                })}
                            </div>

                            {/* Personal Details Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary-600 mb-6">
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {renderSelect('title', 'Title', [
                                        { value: 'Mr', label: 'Mr' },
                                        { value: 'Mrs', label: 'Mrs' },
                                        { value: 'Miss', label: 'Miss' },
                                        { value: 'Ms', label: 'Ms' },
                                        { value: 'Dr', label: 'Dr' },
                                        { value: 'Other', label: 'Other' }
                                    ])}
                                    {renderField('firstName', 'First Name', {
                                        required: 'First name is required'
                                    })}
                                    {renderField('lastName', 'Last Name', {
                                        required: 'Last name is required'
                                    })}
                                    {renderField('middleName', 'Middle Name')}
                                    {renderField('preferredName', 'Preferred Name')}

                                    <div className="w-full">
                                        {renderDateField('dateOfBirth', 'Date of Birth')}
                                    </div>

                                    {renderSelect('gender', 'Gender', [
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Prefer not to say', label: 'Prefer not to say' }
                                    ])}

                                    {renderSelect('jobTitle', 'Job Title', [
                                        { value: 'Health Care Assistant', label: 'Health Care Assistant' },
                                        { value: 'Senior Care Assistant', label: 'Senior Care Assistant' },
                                        { value: 'Nurse', label: 'Nurse' }
                                    ])}

                                    {renderField('nationalInsuranceNumber', 'National Insurance Number', {
                                        required: 'National Insurance number is required'
                                    })}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary-600 mb-6">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {renderField('phone', 'Phone Number', {
                                        required: 'Phone number is required'
                                    })}
                                    {renderField('email', 'Email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Please enter a valid email address'
                                        },
                                        validate: {
                                            noWhitespace: (value: any) =>
                                                value.trim() === value || 'Email cannot contain leading or trailing spaces'
                                        }
                                    })}
                                </div>
                            </div>

                            {/* Address Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary-600 mb-6">
                                    Address Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="sm:col-span-2">
                                        {renderField('address.street', 'Street', {
                                            required: 'Street is required'
                                        })}
                                    </div>
                                    {renderField('address.city', 'City', {
                                        required: 'City is required'
                                    })}
                                    {renderField('address.county', 'County')}
                                    {renderField('address.zipCode', 'Postcode', {
                                        required: 'Postcode is required'
                                    })}
                                    {renderField('address.country', 'Country', {
                                        required: 'Country is required'
                                    })}
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary-600 mb-6">
                                    Emergency Contact
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {renderField('emergencyContact.name', 'Emergency Contact Name', {
                                        required: 'Emergency contact name is required'
                                    })}
                                    {renderField('emergencyContact.relationship', 'Relationship', {
                                        required: 'Relationship is required'
                                    })}
                                    <div className="sm:col-span-2">
                                        {renderField('emergencyContact.phone', 'Emergency Contact Phone', {
                                            required: 'Emergency contact phone is required',
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4 mt-12">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setShowEditButton(true);
                                }}
                                className="px-8 py-2 rounded-lg border border-red-500 text-red-500
                  hover:bg-red-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600
                  text-white hover:from-primary-600 hover:to-primary-700
                  transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <ProfileView />
                )}
            </form>
        </div>
    );
};

export default PersonalInformation;