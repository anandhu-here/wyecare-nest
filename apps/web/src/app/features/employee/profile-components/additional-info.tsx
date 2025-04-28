import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    useGetEmployeeApplicationQuery,
    useUpdateSectionMutation
} from '../employeeApplicationApi';
import {
    Car,
    Globe,
    MapPin,
    NotepadText,
    Save,
    Edit2,
    X,
    CheckCircle2,
    Info,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface AdditionalInfoProps {
    initialData?: Record<string, any>;
    onSubmit?: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface AdditionalInfoData {
    hasTransport: boolean;
    willingToTravel: boolean;
    maxTravelDistance: string;
    additionalNotes: string;
}

interface PreferenceCardProps {
    active?: boolean;
    children?: React.ReactNode;
    className?: string;
    icon: React.ElementType;
    label: string;
    isEditing: boolean;
    onChange: (e: { target: { checked: boolean } }) => void;
    value: boolean;
}

const PreferenceCard: React.FC<PreferenceCardProps> = ({
    active = false,
    children,
    className = '',
    icon: Icon,
    label,
    isEditing,
    onChange,
    value
}) => {
    return (
        <div
            onClick={() => isEditing && onChange({ target: { checked: !value } })}
            className={`
        p-3 rounded-xl border transition-all duration-200 cursor-pointer
        hover:border-primary-300 hover:shadow-sm
        ${active
                    ? 'bg-primary-50 border-primary-200 shadow-sm'
                    : 'bg-white border-gray-200'
                }
        ${className}
      `}
        >
            <div className="flex items-center gap-4">
                {isEditing ? (
                    <div className={`
            w-6 h-6 rounded border-2 flex items-center justify-center
            transition-all duration-200
            ${active
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 bg-white'
                        }
          `}>
                        {active && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                ) : (
                    <div className={`
            w-6 h-6 rounded-full flex items-center justify-center
            ${active ? 'bg-green-100' : 'bg-gray-100'}
          `}>
                        {active
                            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                            : <X className="w-4 h-4 text-gray-400" />
                        }
                    </div>
                )}
                <div className="flex items-center gap-3 flex-1">
                    <Icon className={`w-5 h-5 ${active ? 'text-primary-500' : 'text-gray-400'}`} />
                    <span className={`text-base font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                        {label}
                    </span>
                </div>
                {isEditing && (
                    <div className={`
            text-sm font-medium px-3 py-1 rounded-full
            ${active
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-500'
                        }
          `}>
                        {active ? 'Yes' : 'No'}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
};

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    userId,
    isViewedByYourOrg = false,
    editable = true
}) => {
    const [formInitialized, setFormInitialized] = useState<boolean>(false);
    const dispatch = useDispatch();

    const { data: carerApplication } = useGetEmployeeApplicationQuery({
        carerId: userId
    }, {
        skip: isViewedByYourOrg,
        refetchOnMountOrArgChange: true
    });

    const [updateApplicationSection] = useUpdateSectionMutation();

    const [editableSections, setEditableSections] = useState({
        additionalInfo: false
    });

    const [savingSection, setSavingSection] = useState<{
        [key: string]: boolean;
    }>({});

    // Process initial data
    const processData = (data: any): AdditionalInfoData => {
        if (!data) {
            return {
                hasTransport: false,
                willingToTravel: false,
                maxTravelDistance: '',
                additionalNotes: '',
            };
        }

        return {
            hasTransport: data.hasTransport || false,
            willingToTravel: data.willingToTravel || false,
            maxTravelDistance: data.maxTravelDistance || '',
            additionalNotes: data.additionalNotes || '',
        };
    };

    const defaultValues = editable
        ? processData(carerApplication?.data[selectedSection])
        : processData(initialData);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm<AdditionalInfoData>({
        defaultValues
    });

    const hasTransport = watch('hasTransport');
    const willingToTravel = watch('willingToTravel');

    useEffect(() => {
        if (editable && carerApplication?.data[selectedSection]) {
            reset(processData(carerApplication.data[selectedSection]));
            setFormInitialized(true);
        } else if (!editable && initialData) {
            reset(processData(initialData));
            setFormInitialized(true);
        }
    }, [carerApplication, selectedSection, reset, editable, initialData]);

    const handleSave = async (data: AdditionalInfoData) => {
        if (!editable && !isViewedByYourOrg) return;

        setSavingSection({ additionalInfo: true });

        try {
            await updateApplicationSection({
                section: selectedSection,
                data,
                carerId: userId
            }).unwrap();

            if (isViewedByYourOrg) {
                setEditableSections(prev => ({
                    ...prev,
                    additionalInfo: false
                }));
            }

            toast.success('Additional information saved successfully');
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(`Failed to save additional information: ${error.message}`);
        } finally {
            setSavingSection({ additionalInfo: false });
        }
    };

    const renderSectionHeader = () => (
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-primary-600" />
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Travel & Additional Information
                    </h2>
                    <div className="h-1 w-10 bg-primary-600 rounded-full mt-2" />
                </div>
            </div>

            {!editable && isViewedByYourOrg && (
                <button
                    type="button"
                    onClick={() => setEditableSections(prev => ({
                        ...prev,
                        additionalInfo: !prev.additionalInfo
                    }))}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm transition-colors
            ${editableSections.additionalInfo
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        }`}
                >
                    {editableSections.additionalInfo ? (
                        <>
                            <X className="w-4 h-4 mr-2" />
                            Cancel Edit
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                        </>
                    )}
                </button>
            )}
        </div>
    );

    const renderTravelPreferences = () => {
        const isEditing = editable || editableSections.additionalInfo;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                    name="hasTransport"
                    control={control}
                    render={({ field }) => (
                        <PreferenceCard
                            active={field.value}
                            icon={Car}
                            label="I have my own transport"
                            isEditing={isEditing}
                            onChange={(e) => field.onChange(e.target.checked)}
                            value={field.value}
                        />
                    )}
                />

                <Controller
                    name="willingToTravel"
                    control={control}
                    render={({ field }) => (
                        <PreferenceCard
                            active={field.value}
                            icon={Globe}
                            label="I am willing to travel"
                            isEditing={isEditing}
                            onChange={(e) => field.onChange(e.target.checked)}
                            value={field.value}
                        />
                    )}
                />

                {(hasTransport || willingToTravel) && (
                    <div className="col-span-full md:col-span-1">
                        <Controller
                            name="maxTravelDistance"
                            control={control}
                            rules={{
                                required: { value: true, message: 'Please enter maximum travel distance' },
                                min: { value: 0, message: 'Distance cannot be negative' },
                                max: { value: 1000, message: 'Maximum distance allowed is 1000 miles' },
                                pattern: { value: /^\d+$/, message: 'Please enter a valid number' }
                            }}
                            render={({ field, fieldState: { error } }) => (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Maximum Travel Distance
                                    </label>
                                    {isEditing ? (
                                        <>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                                        field.onChange(value);
                                                    }}
                                                    className={`pl-10 pr-16 py-2 w-full border rounded-lg 
                            transition-all duration-200
                            ${error
                                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                                                        }
                            ${field.value ? 'bg-white' : 'bg-gray-50'}
                          `}
                                                    placeholder="Enter distance"
                                                    aria-describedby={error ? 'distance-error' : undefined}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500">miles</span>
                                                </div>
                                            </div>
                                            {error && (
                                                <div
                                                    id="distance-error"
                                                    role="alert"
                                                    className="flex items-center gap-2 text-red-600 text-sm mt-1.5"
                                                >
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                    <span>{error.message}</span>
                                                </div>
                                            )}
                                            {!error && (
                                                <p className="text-sm text-gray-500 mt-1.5">
                                                    Enter a distance between 0 and 1000 miles
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-lg font-medium">
                                            {field.value ? `${field.value} miles` : 'Not specified'}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderAdditionalNotes = () => {
        const isEditing = editable || editableSections.additionalInfo;

        return (
            <div className="mt-2">
                <Controller
                    name="additionalNotes"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <NotepadText className="w-5 h-5 text-primary-500" />
                                ) : (
                                    <Info className="w-5 h-5 text-primary-500" />
                                )}
                                <span className="font-medium text-primary-700">
                                    Additional Notes
                                </span>
                            </div>
                            {isEditing ? (
                                <>
                                    <textarea
                                        {...field}
                                        rows={4}
                                        className={`w-full px-4 py-3 border rounded-lg 
                      transition-all duration-200
                      ${error
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                                            }
                      ${field.value ? 'bg-white' : 'bg-gray-50'}
                    `}
                                        placeholder="Add any additional information that might be relevant..."
                                        aria-describedby={error ? 'notes-error' : 'notes-helper'}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <div>
                                            {error ? (
                                                <div
                                                    id="notes-error"
                                                    role="alert"
                                                    className="flex items-center gap-2 text-red-600 text-sm"
                                                >
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                    <span>{error.message}</span>
                                                </div>
                                            ) : (
                                                <p
                                                    id="notes-helper"
                                                    className="text-sm text-gray-500"
                                                >
                                                    Add any relevant information about your preferences or requirements
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {field.value?.length || 0}/1000
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-700">
                                    {field.value || 'No additional notes provided.'}
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>
        );
    };

    return (
        <div className="bg-gray-50 rounded-2xl">
            <form onSubmit={handleSubmit(handleSave)}>
                <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
                    {renderSectionHeader()}
                    {renderTravelPreferences()}
                    {renderAdditionalNotes()}

                    {(editable || editableSections.additionalInfo) && (
                        <div className="flex justify-end mt-8">
                            <button
                                type="submit"
                                disabled={savingSection.additionalInfo}
                                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg 
                  hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50
                  shadow-sm hover:shadow-md"
                            >
                                {savingSection.additionalInfo ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdditionalInfo;