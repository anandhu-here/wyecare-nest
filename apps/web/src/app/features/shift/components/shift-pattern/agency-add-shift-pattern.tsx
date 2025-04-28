"use client"

import React, { useState, useEffect } from 'react'
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    PencilIcon,
    Trash2Icon,
    PlusIcon,
    InfoIcon,
    ClockIcon,
    CoffeeIcon,
    DollarSignIcon
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TimeSelect } from '@/components/ui/time-select'
import { toast } from 'react-toastify'
import { Badge } from "@/components/ui/badge"
import { useGetAgencyTemporaryHomesQuery, useGetLinkedOrganizationsQuery } from '@/app/features/organization/organizationApi'
import { MultiSelect } from '@/components/ui/multiselect'

// Define interfaces based on the new API structure
interface CareHome {
    _id: string;
    name: string;
    isTemporary?: boolean;
}

interface HomeRate {
    careHomeId: string;
    careHomeName: string;

    carerWeekdayRate: number;
    carerWeekendRate: number;
    carerHolidayRate: number;
    carerEmergencyWeekdayRate: number;
    carerEmergencyWeekendRate: number;
    carerEmergencyHolidayRate: number;

    nurseWeekdayRate: number;
    nurseWeekendRate: number;
    nurseHolidayRate: number;
    nurseEmergencyWeekdayRate: number;
    nurseEmergencyWeekendRate: number;
    nurseEmergencyHolidayRate: number;

    seniorCarerWeekdayRate: number;
    seniorCarerWeekendRate: number;
    seniorCarerHolidayRate: number;
    seniorCarerEmergencyWeekdayRate: number;
    seniorCarerEmergencyWeekendRate: number;
    seniorCarerEmergencyHolidayRate: number;
}

interface Timing {
    careHomeId: string;
    startTime: string;
    endTime: string;
    billableHours: number | null;
    breakHours: number | null;
}
interface UserTypeRate {
    userType: string;
    weekdayRate: number;
    weekendRate: number;
    holidayRate: number;
    emergencyWeekdayRate: number;
    emergencyWeekendRate: number;
    emergencyHolidayRate: number;
}
interface AgencyShiftPattern {
    _id?: string;
    name: string;
    homeRates: HomeRate[];
    timings: Timing[];
    userTypeRates: UserTypeRate[];
}

interface FormData {
    name: string;
    homeGroups: {
        selectedHomes: { id: string; name: string }[];
        rates: {
            carerRates: {
                weekdayRate: number;
                weekendRate: number;
                holidayRate: number;
                emergencyWeekdayRate: number;
                emergencyWeekendRate: number;
                emergencyHolidayRate: number;
            };
            nurseRates: {
                weekdayRate: number;
                weekendRate: number;
                holidayRate: number;
                emergencyWeekdayRate: number;
                emergencyWeekendRate: number;
                emergencyHolidayRate: number;
            };
            seniorCarerRates: {
                weekdayRate: number;
                weekendRate: number;
                holidayRate: number;
                emergencyWeekdayRate: number;
                emergencyWeekendRate: number;
                emergencyHolidayRate: number;
            };
        };
    }[];
    timingGroups: {
        selectedHomes: { id: string; name: string }[];
        startTime: string;
        endTime: string;
        billableHours: number | null;
        breakHours: number | null;
    }[];

    userTypeRates: {
        userType: string;
        weekdayRate: number;
        weekendRate: number;
        holidayRate: number;
        emergencyWeekdayRate: number;
        emergencyWeekendRate: number;
        emergencyHolidayRate: number;
    }[];
}

interface AgencyShiftPatternDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (shiftPattern: AgencyShiftPattern) => void;
    selectedShiftPattern?: AgencyShiftPattern | null;
}

// Form input component
const FormInput: React.FC<{
    label: string;
    error?: string;
    disabled?: boolean;
    type?: string;
    required?: boolean;
    register: any;
    name: string;
    icon?: React.ReactNode;
    tooltip?: string;
}> = ({ label, error, disabled, type = "text", required = false, register, name, icon, tooltip }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <Label htmlFor={name} className="text-sm font-medium flex items-center">
                {icon && <span className="mr-1">{icon}</span>}
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            {tooltip && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
        <Input
            id={name}
            type={type}
            {...register}
            disabled={disabled}
            className={`${disabled ? 'bg-muted cursor-not-allowed' : ''}`}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
);

const AgencyShiftPatternDialog: React.FC<AgencyShiftPatternDialogProps> = ({
    open,
    onClose,
    onSave,
    selectedShiftPattern
}) => {


    const [isEditing, setIsEditing] = useState(false);

    // API queries
    const {
        data: linkedOrganizations,
        isLoading: linkedOrgsLoading
    } = useGetLinkedOrganizationsQuery('home', { skip: !open });

    const {
        data: tempHomes,
        isLoading: tempHomesLoading
    } = useGetAgencyTemporaryHomesQuery(undefined, { skip: !open });

    const userTypes = ['carer', 'senior_carer', 'nurse'];

    const defaultUserTypeRates = userTypes.map((userType) => ({
        userType,
        weekdayRate: 0,
        weekendRate: 0,
        holidayRate: 0,
        emergencyWeekdayRate: 0,
        emergencyWeekendRate: 0,
        emergencyHolidayRate: 0,
    }));

    // Default rate values
    const defaultRates = {
        carerRates: {
            weekdayRate: 0,
            weekendRate: 0,
            holidayRate: 0,
            emergencyWeekdayRate: 0,
            emergencyWeekendRate: 0,
            emergencyHolidayRate: 0
        },
        nurseRates: {
            weekdayRate: 0,
            weekendRate: 0,
            holidayRate: 0,
            emergencyWeekdayRate: 0,
            emergencyWeekendRate: 0,
            emergencyHolidayRate: 0
        },
        seniorCarerRates: {
            weekdayRate: 0,
            weekendRate: 0,
            holidayRate: 0,
            emergencyWeekdayRate: 0,
            emergencyWeekendRate: 0,
            emergencyHolidayRate: 0
        }
    };

    // Form setup
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        defaultValues: {
            name: '',
            homeGroups: [{
                selectedHomes: [],
                rates: { ...defaultRates }
            }],
            timingGroups: [{
                selectedHomes: [],
                startTime: '',
                endTime: '',
                billableHours: null,
                breakHours: null
            }],

            userTypeRates: defaultUserTypeRates
        }
    });

    // Field arrays
    const {
        fields: homeGroupFields,
        append: appendHomeGroup,
        remove: removeHomeGroup
    } = useFieldArray({ control, name: 'homeGroups' });

    const {
        fields: timingGroupFields,
        append: appendTimingGroup,
        remove: removeTimingGroup
    } = useFieldArray({ control, name: 'timingGroups' });

    // Watch timing groups to calculate durations
    const watchedTimingGroups = watch('timingGroups');

    const allHomes = React.useMemo(() => {
        const homes: { _id: string; name: string; isTemporary?: boolean }[] = [];

        // Add linked organizations
        if (linkedOrganizations?.data?.length) {
            linkedOrganizations?.data?.forEach(org => {
                homes.push({
                    _id: org._id,  // Keep as _id to match MultiSelect expected format
                    name: org.name
                });
            });
        }

        // Add temporary homes with a special label
        if (tempHomes?.data?.length) {
            tempHomes.data.forEach(home => {
                homes.push({
                    _id: home._id,  // Keep as _id to match MultiSelect expected format
                    name: `${home.name} (Temporary)`,
                    isTemporary: true
                });
            });
        }

        return homes;
    }, [linkedOrganizations, tempHomes]);


    // Calculate shift durations
    const calculateShiftDurations = () => {
        return watchedTimingGroups.map((group, index) => {
            if (!group.startTime || !group.endTime) return null;

            const start = new Date(`2000-01-01T${group.startTime}`);
            const end = new Date(`2000-01-01T${group.endTime}`);

            // Handle overnight shifts
            let durationHours;
            if (end < start) {
                const endNextDay = new Date(end);
                endNextDay.setDate(endNextDay.getDate() + 1);
                durationHours = (endNextDay.getTime() - start.getTime()) / (1000 * 60 * 60);
            } else {
                durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }

            return {
                index,
                durationHours: parseFloat(durationHours.toFixed(2)),
                maxBillableHours: parseFloat(durationHours.toFixed(2))
            };
        });
    };

    const shiftDurations = calculateShiftDurations();

    // Populate form with existing data
    useEffect(() => {
        if (open) {
            if (selectedShiftPattern) {
                populateForm(selectedShiftPattern);
                setIsEditing(false);
            } else {
                reset();
                setIsEditing(true);
            }
        }
    }, [open, selectedShiftPattern, reset]);
    const populateForm = (shiftPattern: AgencyShiftPattern) => {
        // Set basic form values
        setValue('name', shiftPattern.name);

        // Set userTypeRates if they exist
        if (shiftPattern.userTypeRates && shiftPattern.userTypeRates.length > 0) {
            setValue('userTypeRates', shiftPattern.userTypeRates);
        }

        // Create homeRates from rates if needed
        let homeRates = shiftPattern.homeRates || [];

        // If we have rates but no homeRates, transform the rates into homeRates format
        if (!homeRates.length && shiftPattern.rates?.length) {
            // First, get unique care home IDs
            const uniqueCareHomeIds = [...new Set(shiftPattern.rates.map(rate => rate.careHomeId))];

            // For each care home, create a homeRate object
            homeRates = uniqueCareHomeIds.map(careHomeId => {
                // Find the care home name from the allHomes array
                const matchingHome = allHomes.find(home => home._id === careHomeId);
                const careHomeName = matchingHome ? matchingHome.name : `Home ${careHomeId}`;

                // Find rates for this care home
                const carerRate = shiftPattern.rates.find(r => r.careHomeId === careHomeId && r.userType === 'carer') || {};
                const nurseRate = shiftPattern.rates.find(r => r.careHomeId === careHomeId && r.userType === 'nurse') || {};
                const seniorCarerRate = shiftPattern.rates.find(r => r.careHomeId === careHomeId && r.userType === 'senior_carer') || {};

                return {
                    careHomeId,
                    careHomeName,

                    // Carer rates
                    carerWeekdayRate: carerRate.weekdayRate || 0,
                    carerWeekendRate: carerRate.weekendRate || 0,
                    carerHolidayRate: carerRate.holidayRate || 0,
                    carerEmergencyWeekdayRate: carerRate.emergencyWeekdayRate || 0,
                    carerEmergencyWeekendRate: carerRate.emergencyWeekendRate || 0,
                    carerEmergencyHolidayRate: carerRate.emergencyHolidayRate || 0,

                    // Nurse rates
                    nurseWeekdayRate: nurseRate.weekdayRate || 0,
                    nurseWeekendRate: nurseRate.weekendRate || 0,
                    nurseHolidayRate: nurseRate.holidayRate || 0,
                    nurseEmergencyWeekdayRate: nurseRate.emergencyWeekdayRate || 0,
                    nurseEmergencyWeekendRate: nurseRate.emergencyWeekendRate || 0,
                    nurseEmergencyHolidayRate: nurseRate.emergencyHolidayRate || 0,

                    // Senior carer rates
                    seniorCarerWeekdayRate: seniorCarerRate.weekdayRate || 0,
                    seniorCarerWeekendRate: seniorCarerRate.weekendRate || 0,
                    seniorCarerHolidayRate: seniorCarerRate.holidayRate || 0,
                    seniorCarerEmergencyWeekdayRate: seniorCarerRate.emergencyWeekdayRate || 0,
                    seniorCarerEmergencyWeekendRate: seniorCarerRate.emergencyWeekendRate || 0,
                    seniorCarerEmergencyHolidayRate: seniorCarerRate.emergencyHolidayRate || 0
                };
            });
        }

        // Group home rates by identical rate structures
        const homeRateGroups = new Map<string, {
            selectedHomes: { id: string; name: string }[],
            rates: any
        }>();

        // Process homeRates if they exist
        if (homeRates.length > 0) {
            homeRates.forEach(homeRate => {
                // Skip invalid entries
                if (!homeRate.careHomeId) {
                    console.warn('Skipping homeRate without careHomeId', homeRate);
                    return;
                }

                // If careHomeName is missing, try to find it from allHomes
                let careHomeName = homeRate.careHomeName;
                if (!careHomeName) {
                    const matchingHome = allHomes.find(home => home._id === homeRate.careHomeId);
                    careHomeName = matchingHome ? matchingHome.name : `Home ${homeRate.careHomeId}`;
                }

                // Create a fingerprint for this home's rates
                const rateFingerprint = JSON.stringify({
                    carerRates: {
                        weekdayRate: homeRate.carerWeekdayRate || 0,
                        weekendRate: homeRate.carerWeekendRate || 0,
                        holidayRate: homeRate.carerHolidayRate || 0,
                        emergencyWeekdayRate: homeRate.carerEmergencyWeekdayRate || 0,
                        emergencyWeekendRate: homeRate.carerEmergencyWeekendRate || 0,
                        emergencyHolidayRate: homeRate.carerEmergencyHolidayRate || 0
                    },
                    nurseRates: {
                        weekdayRate: homeRate.nurseWeekdayRate || 0,
                        weekendRate: homeRate.nurseWeekendRate || 0,
                        holidayRate: homeRate.nurseHolidayRate || 0,
                        emergencyWeekdayRate: homeRate.nurseEmergencyWeekdayRate || 0,
                        emergencyWeekendRate: homeRate.nurseEmergencyWeekendRate || 0,
                        emergencyHolidayRate: homeRate.nurseEmergencyHolidayRate || 0
                    },
                    seniorCarerRates: {
                        weekdayRate: homeRate.seniorCarerWeekdayRate || 0,
                        weekendRate: homeRate.seniorCarerWeekendRate || 0,
                        holidayRate: homeRate.seniorCarerHolidayRate || 0,
                        emergencyWeekdayRate: homeRate.seniorCarerEmergencyWeekdayRate || 0,
                        emergencyWeekendRate: homeRate.seniorCarerEmergencyWeekendRate || 0,
                        emergencyHolidayRate: homeRate.seniorCarerEmergencyHolidayRate || 0
                    }
                });

                if (!homeRateGroups.has(rateFingerprint)) {
                    homeRateGroups.set(rateFingerprint, {
                        selectedHomes: [],
                        rates: {
                            carerRates: {
                                weekdayRate: homeRate.carerWeekdayRate || 0,
                                weekendRate: homeRate.carerWeekendRate || 0,
                                holidayRate: homeRate.carerHolidayRate || 0,
                                emergencyWeekdayRate: homeRate.carerEmergencyWeekdayRate || 0,
                                emergencyWeekendRate: homeRate.carerEmergencyWeekendRate || 0,
                                emergencyHolidayRate: homeRate.carerEmergencyHolidayRate || 0
                            },
                            nurseRates: {
                                weekdayRate: homeRate.nurseWeekdayRate || 0,
                                weekendRate: homeRate.nurseWeekendRate || 0,
                                holidayRate: homeRate.nurseHolidayRate || 0,
                                emergencyWeekdayRate: homeRate.nurseEmergencyWeekdayRate || 0,
                                emergencyWeekendRate: homeRate.nurseEmergencyWeekendRate || 0,
                                emergencyHolidayRate: homeRate.nurseEmergencyHolidayRate || 0
                            },
                            seniorCarerRates: {
                                weekdayRate: homeRate.seniorCarerWeekdayRate || 0,
                                weekendRate: homeRate.seniorCarerWeekendRate || 0,
                                holidayRate: homeRate.seniorCarerHolidayRate || 0,
                                emergencyWeekdayRate: homeRate.seniorCarerEmergencyWeekdayRate || 0,
                                emergencyWeekendRate: homeRate.seniorCarerEmergencyWeekendRate || 0,
                                emergencyHolidayRate: homeRate.seniorCarerEmergencyHolidayRate || 0
                            }
                        }
                    });
                }

                // Add this home to the group
                const group = homeRateGroups.get(rateFingerprint);
                if (group) {
                    group.selectedHomes.push({
                        id: homeRate.careHomeId,
                        name: careHomeName
                    });
                }
            });

            // Convert the Map to an array for the form
            const homeGroups = Array.from(homeRateGroups.values());
            setValue('homeGroups', homeGroups.length > 0 ? homeGroups : [{
                selectedHomes: [],
                rates: defaultRates
            }]);
        }

        // Group timings by identical configurations
        const timingGroups = new Map<string, {
            selectedHomes: { id: string; name: string }[],
            startTime: string,
            endTime: string,
            billableHours: number | null,
            breakHours: number | null
        }>();

        // Process timings if they exist
        if (shiftPattern.timings && shiftPattern.timings.length > 0) {
            shiftPattern.timings.forEach(timing => {
                // Skip invalid entries
                if (!timing.careHomeId) {
                    console.warn('Skipping timing without careHomeId', timing);
                    return;
                }

                // Find the home name
                let homeName = '';
                const matchingHome = allHomes.find(home => home._id === timing.careHomeId);
                if (matchingHome) {
                    homeName = matchingHome.name;
                } else {
                    // Try to find it in homeRates
                    const homeRate = homeRates.find(hr => hr.careHomeId === timing.careHomeId);
                    homeName = homeRate?.careHomeName || `Home ${timing.careHomeId}`;
                }

                // Create a fingerprint for this timing
                const timingFingerprint = `${timing.startTime}-${timing.endTime}-${timing.billableHours}-${timing.breakHours}`;

                if (!timingGroups.has(timingFingerprint)) {
                    timingGroups.set(timingFingerprint, {
                        selectedHomes: [],
                        startTime: timing.startTime,
                        endTime: timing.endTime,
                        billableHours: timing.billableHours,
                        breakHours: timing.breakHours
                    });
                }

                // Add this home to the group
                const group = timingGroups.get(timingFingerprint);
                if (group) {
                    group.selectedHomes.push({
                        id: timing.careHomeId,
                        name: homeName
                    });
                }
            });

            // Convert the Map to an array for the form
            const timingsArray = Array.from(timingGroups.values());
            setValue('timingGroups', timingsArray.length > 0 ? timingsArray : [{
                selectedHomes: [],
                startTime: '',
                endTime: '',
                billableHours: null,
                breakHours: null
            }]);
        }

        // Log the form values for debugging
        console.log("Form populated with:", {
            name: watch('name'),
            homeGroups: watch('homeGroups'),
            timingGroups: watch('timingGroups'),
            userTypeRates: watch('userTypeRates')
        });
    };

    // Handle form submission
    const handleSaveShiftPattern: SubmitHandler<FormData> = (data) => {
        try {
            console.log('Form data:', data);

            // Make sure you're not sending empty arrays
            if (data.homeGroups.length === 0 || data.homeGroups[0].selectedHomes.length === 0) {
                toast.error('Please select at least one home for rates');
                return;
            }

            if (data.timingGroups.length === 0 || data.timingGroups[0].selectedHomes.length === 0) {
                toast.error('Please select at least one home for timings');
                return;
            }

            // Debug the structure
            console.log('Selected homes in homeGroups:', data.homeGroups[0].selectedHomes);
            console.log('Selected homes in timingGroups:', data.timingGroups[0].selectedHomes);

            // Transform form data to match API structure with explicit logging
            const homeRates = data.homeGroups.flatMap(group => {
                console.log('Processing home group with homes:', group.selectedHomes);
                return group.selectedHomes.map(home => {
                    console.log('Creating homeRate for home:', home);
                    return {
                        careHomeId: home.id,
                        careHomeName: home.name,

                        carerWeekdayRate: group.rates.carerRates.weekdayRate,
                        carerWeekendRate: group.rates.carerRates.weekendRate,
                        carerHolidayRate: group.rates.carerRates.holidayRate,
                        carerEmergencyWeekdayRate: group.rates.carerRates.emergencyWeekdayRate,
                        carerEmergencyWeekendRate: group.rates.carerRates.emergencyWeekendRate,
                        carerEmergencyHolidayRate: group.rates.carerRates.emergencyHolidayRate,

                        nurseWeekdayRate: group.rates.nurseRates.weekdayRate,
                        nurseWeekendRate: group.rates.nurseRates.weekendRate,
                        nurseHolidayRate: group.rates.nurseRates.holidayRate,
                        nurseEmergencyWeekdayRate: group.rates.nurseRates.emergencyWeekdayRate,
                        nurseEmergencyWeekendRate: group.rates.nurseRates.emergencyWeekendRate,
                        nurseEmergencyHolidayRate: group.rates.nurseRates.emergencyHolidayRate,

                        seniorCarerWeekdayRate: group.rates.seniorCarerRates.weekdayRate,
                        seniorCarerWeekendRate: group.rates.seniorCarerRates.weekendRate,
                        seniorCarerHolidayRate: group.rates.seniorCarerRates.holidayRate,
                        seniorCarerEmergencyWeekdayRate: group.rates.seniorCarerRates.emergencyWeekdayRate,
                        seniorCarerEmergencyWeekendRate: group.rates.seniorCarerRates.emergencyWeekendRate,
                        seniorCarerEmergencyHolidayRate: group.rates.seniorCarerRates.emergencyHolidayRate
                    };
                });
            });

            console.log('Generated homeRates:', homeRates);

            const timings = data.timingGroups.flatMap(group => {
                console.log('Processing timing group with homes:', group.selectedHomes);
                return group.selectedHomes.map(home => {
                    console.log('Creating timing for home:', home);
                    return {
                        careHomeId: home.id,
                        startTime: group.startTime,
                        endTime: group.endTime,
                        billableHours: group.billableHours || undefined,
                        breakHours: group.breakHours || undefined
                    };
                });
            });

            console.log('Generated timings:', timings);

            const newShiftPattern: AgencyShiftPattern = {
                ...(selectedShiftPattern?._id ? { _id: selectedShiftPattern._id } : {}),
                name: data.name,
                homeRates,
                timings,
                userTypeRates: data.userTypeRates.map(rate => ({
                    userType: rate.userType.toLowerCase().replace(' ', '_'), // Convert to snake_case for backend
                    weekdayRate: rate.weekdayRate,
                    weekendRate: rate.weekendRate,
                    holidayRate: rate.holidayRate,
                    emergencyWeekdayRate: rate.emergencyWeekdayRate,
                    emergencyWeekendRate: rate.emergencyWeekendRate,
                    emergencyHolidayRate: rate.emergencyHolidayRate
                }))
            };

            console.log('Final shift pattern to save:', newShiftPattern);

            // Make sure we have careHomeId in all objects
            if (newShiftPattern.homeRates.some(hr => !hr.careHomeId)) {
                toast.error('Missing careHomeId in homeRates');
                return;
            }

            if (newShiftPattern.timings.some(t => !t.careHomeId)) {
                toast.error('Missing careHomeId in timings');
                return;
            }

            onSave(newShiftPattern);
            reset();
            setIsEditing(false);
            onClose();
            toast.success(selectedShiftPattern ? 'Agency shift pattern updated successfully' : 'Agency shift pattern created successfully');
        } catch (error: any) {
            console.error('Error saving agency shift pattern:', error);
            toast.error(error?.message || 'Failed to save agency shift pattern');
        }
    };

    const renderUserTypeRateFields = (
        userTypeIndex: number,
        isEmergency: boolean = false
    ) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weekday Rate */}
            <Controller
                name={`userTypeRates.${userTypeIndex}.${isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekday' : 'Weekday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Weekday Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />

            {/* Weekend Rate */}
            <Controller
                name={`userTypeRates.${userTypeIndex}.${isEmergency ? 'emergencyWeekendRate' : 'weekendRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekend' : 'Weekend'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Weekend Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />

            {/* Holiday Rate */}
            <Controller
                name={`userTypeRates.${userTypeIndex}.${isEmergency ? 'emergencyHolidayRate' : 'holidayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency holiday' : 'Holiday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Holiday Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />
        </div>
    );

    // Render rate input fields for a role
    const renderRateFields = (
        homeGroupIndex: number,
        roleType: 'carerRates' | 'nurseRates' | 'seniorCarerRates',
        isEmergency: boolean = false
    ) => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weekday Rate */}
            <Controller
                name={`homeGroups.${homeGroupIndex}.rates.${roleType}.${isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekday' : 'Weekday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Weekday Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />

            {/* Weekend Rate */}
            <Controller
                name={`homeGroups.${homeGroupIndex}.rates.${roleType}.${isEmergency ? 'emergencyWeekendRate' : 'weekendRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekend' : 'Weekend'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Weekend Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />

            {/* Holiday Rate */}
            <Controller
                name={`homeGroups.${homeGroupIndex}.rates.${roleType}.${isEmergency ? 'emergencyHolidayRate' : 'holidayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency holiday' : 'Holiday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field, fieldState: { error } }) => (
                    <div className="space-y-2">
                        <Label htmlFor={`${field.name}-input`} className="text-sm">
                            {isEmergency ? 'Emergency ' : ''}Holiday Rate
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">£</span>
                            <Input
                                id={`${field.name}-input`}
                                {...field}
                                type="number"
                                step="0.01"
                                disabled={!isEditing}
                                className={`pl-8 ${error ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {error && <p className="text-xs text-destructive">{error.message}</p>}
                    </div>
                )}
            />
        </div>
    );

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl">
                            {selectedShiftPattern
                                ? isEditing
                                    ? 'Edit Agency Shift Pattern'
                                    : 'View Agency Shift Pattern'
                                : 'Add Agency Shift Pattern'}
                        </DialogTitle>
                        {selectedShiftPattern && !isEditing && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditing(true)}
                                className="h-8 w-8"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Content */}
                <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)] overflow-y-auto">
                    <form onSubmit={handleSubmit(handleSaveShiftPattern)} className="space-y-6 px-6 py-4">
                        {/* Shift Pattern Name */}
                        <Card>
                            <CardContent className="pt-6">
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Shift pattern name is required' }}
                                    render={({ field }) => (
                                        <FormInput
                                            label="Shift Pattern Name"
                                            required
                                            register={field}
                                            name={field.name}
                                            error={errors.name?.message}
                                            disabled={!isEditing}
                                            tooltip="Enter a descriptive name for this agency shift pattern"
                                        />
                                    )}
                                />
                            </CardContent>
                        </Card>
                        {/* Shift Timings Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Shift Timings</h3>

                            {timingGroupFields.map((field, index) => {
                                const shiftDuration = shiftDurations[index];
                                const maxHours = shiftDuration?.durationHours || 0;
                                const breakHours = watchedTimingGroups[index]?.breakHours || 0;
                                const maxBillableHours = Math.max(0, maxHours - breakHours);
                                console.log(`MultiSelect for homeGroups[${index}]:`, {
                                    fieldValue: field.value,
                                    availableOptions: allHomes
                                });


                                return (
                                    <Card key={field._id}>
                                        <CardContent className="pt-6 relative">
                                            {/* Care Homes Select */}
                                            <div className="mb-4">
                                                <Label className="text-sm font-medium mb-2 block">
                                                    Care Homes
                                                </Label>
                                                <Controller
                                                    name={`timingGroups.${index}.selectedHomes`}
                                                    control={control}
                                                    rules={{ required: 'Please select at least one care home' }}
                                                    render={({ field }) => {
                                                        // Convert field.value (array of {id, name} objects) to array of ids for MultiSelect
                                                        const selectedIds = field.value.map(home => home.id);

                                                        return (
                                                            <div>
                                                                <MultiSelect
                                                                    options={allHomes}
                                                                    value={selectedIds}
                                                                    onChange={(newSelectedIds) => {
                                                                        // Convert selected ids back to {id, name} objects
                                                                        const newSelectedHomes = newSelectedIds.map(id => {
                                                                            const home = allHomes.find(h => h._id === id);
                                                                            return { id: id, name: home ? home.name : '' };
                                                                        });
                                                                        field.onChange(newSelectedHomes);
                                                                    }}
                                                                    disabled={!isEditing}
                                                                    error={errors.timingGroups?.[index]?.selectedHomes?.message}
                                                                    placeholder="Select care homes..."
                                                                />
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <Controller
                                                    name={`timingGroups.${index}.startTime`}
                                                    control={control}
                                                    rules={{ required: 'Start time is required' }}
                                                    render={({ field }) => (
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium flex items-center">
                                                                <ClockIcon className="h-4 w-4 mr-1" />
                                                                Start Time
                                                            </Label>
                                                            <TimeSelect
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                disabled={!isEditing}
                                                                label=""
                                                            />
                                                            {errors.timingGroups?.[index]?.startTime && (
                                                                <p className="text-xs text-destructive">
                                                                    {errors.timingGroups[index]?.startTime?.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                                <Controller
                                                    name={`timingGroups.${index}.endTime`}
                                                    control={control}
                                                    rules={{ required: 'End time is required' }}
                                                    render={({ field }) => (
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium flex items-center">
                                                                <ClockIcon className="h-4 w-4 mr-1" />
                                                                End Time
                                                            </Label>
                                                            <TimeSelect
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                disabled={!isEditing}
                                                                label=""
                                                            />
                                                            {errors.timingGroups?.[index]?.endTime && (
                                                                <p className="text-xs text-destructive">
                                                                    {errors.timingGroups[index]?.endTime?.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                            </div>

                                            {/* Show shift duration if we have valid start/end times */}
                                            {shiftDuration && shiftDuration.durationHours > 0 && (
                                                <div className="bg-muted p-3 rounded-md text-sm mb-4">
                                                    <p>Total shift duration: <span className="font-semibold">{shiftDuration.durationHours.toFixed(2)} hours</span></p>
                                                </div>
                                            )}

                                            {/* Break hours and Billable hours */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Controller
                                                    name={`timingGroups.${index}.breakHours`}
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (value === null || value === undefined) return true;
                                                            if (value < 0) return 'Break hours cannot be negative';
                                                            if (value > maxHours) return `Break hours cannot exceed total shift duration (${maxHours.toFixed(2)} hours)`;
                                                            return true;
                                                        }
                                                    }}
                                                    render={({ field, fieldState: { error } }) => (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Label htmlFor={`break-hours-${index}`} className="text-sm font-medium flex items-center">
                                                                    <CoffeeIcon className="h-4 w-4 mr-1" />
                                                                    Break Hours
                                                                </Label>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Non-billable break time during the shift</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <Input
                                                                id={`break-hours-${index}`}
                                                                type="number"
                                                                step="0.25"
                                                                min="0"
                                                                max={maxHours}
                                                                value={field.value === null ? '' : field.value}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                                    field.onChange(val);
                                                                }}
                                                                disabled={!isEditing || !maxHours}
                                                                className={error ? 'border-destructive' : ''}
                                                                placeholder="Enter hours"
                                                            />
                                                            {error && (
                                                                <p className="text-xs text-destructive">{error.message}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                />

                                                <Controller
                                                    name={`timingGroups.${index}.billableHours`}
                                                    control={control}
                                                    rules={{
                                                        validate: (value) => {
                                                            if (value === null || value === undefined) return true;
                                                            if (value < 0) return 'Billable hours cannot be negative';
                                                            if (value > maxBillableHours) {
                                                                return `Billable hours cannot exceed ${maxBillableHours.toFixed(2)} hours (total - break)`;
                                                            }
                                                            return true;
                                                        }
                                                    }}
                                                    render={({ field, fieldState: { error } }) => (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Label htmlFor={`billable-hours-${index}`} className="text-sm font-medium flex items-center">
                                                                    <DollarSignIcon className="h-4 w-4 mr-1" />
                                                                    Billable Hours
                                                                </Label>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Actual hours to bill (cannot exceed total shift duration minus breaks)</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <Input
                                                                id={`billable-hours-${index}`}
                                                                type="number"
                                                                step="0.25"
                                                                min="0"
                                                                max={maxBillableHours}
                                                                value={field.value === null ? '' : field.value}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                                    field.onChange(val);
                                                                }}
                                                                disabled={!isEditing || !maxHours}
                                                                className={error ? 'border-destructive' : ''}
                                                                placeholder="Enter hours"
                                                            />
                                                            {error && (
                                                                <p className="text-xs text-destructive">{error.message}</p>
                                                            )}

                                                            {!error && maxBillableHours > 0 && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Maximum: {maxBillableHours.toFixed(2)} hours
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                />
                                            </div>

                                            {/* Auto-calculate billable hours suggestion */}
                                            {isEditing && maxHours > 0 && (
                                                <div className="mt-4 mb-4">
                                                    <Alert variant="outline" className="bg-muted/50">
                                                        <div className="flex items-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    // Calculate default billable hours (total - break)
                                                                    const breakHrs = watchedTimingGroups[index]?.breakHours || 0;
                                                                    const billableHrs = Math.max(0, maxHours - breakHrs);
                                                                    setValue(`timingGroups.${index}.billableHours`, parseFloat(billableHrs.toFixed(2)));
                                                                }}
                                                                className="mr-2"
                                                            >
                                                                Auto-calculate
                                                            </Button>
                                                            <AlertDescription>
                                                                Set billable hours to total shift duration minus breaks
                                                            </AlertDescription>
                                                        </div>
                                                    </Alert>
                                                </div>
                                            )}

                                            {isEditing && timingGroupFields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeTimingGroup(index)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2Icon className="h-4 w-4 mr-2" />
                                                    Remove Timing Group
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendTimingGroup({
                                        selectedHomes: [],
                                        startTime: '',
                                        endTime: '',
                                        billableHours: null,
                                        breakHours: null
                                    })}
                                    className="w-full"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Another Timing
                                </Button>
                            )}
                        </div>

                        {/* Care Home Rates Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium">Care Home Billing Rates / hour</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Rates charged to care homes for staff provided by the agency</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Badge variant="outline" className="font-normal">Agency → Care Home</Badge>
                            </div>

                            {homeGroupFields.map((field, index) => (
                                <Card key={field._id}>
                                    <CardContent className="pt-6">
                                        <div className="space-y-6">
                                            {/* Care Homes Select */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">
                                                    Care Homes
                                                </Label>
                                                <Controller
                                                    name={`homeGroups.${index}.selectedHomes`}
                                                    control={control}
                                                    rules={{ required: 'Please select at least one care home' }}
                                                    render={({ field }) => {
                                                        // Convert field.value (array of {id, name} objects) to array of ids for MultiSelect
                                                        const selectedIds = field.value.map(home => home.id);

                                                        return (
                                                            <div>
                                                                <MultiSelect
                                                                    options={allHomes}
                                                                    value={selectedIds}
                                                                    onChange={(newSelectedIds) => {
                                                                        // Convert selected ids back to {id, name} objects
                                                                        const newSelectedHomes = newSelectedIds.map(id => {
                                                                            const home = allHomes.find(h => h._id === id);
                                                                            return { id: id, name: home ? home.name : '' };
                                                                        });
                                                                        field.onChange(newSelectedHomes);
                                                                    }}
                                                                    disabled={!isEditing}
                                                                    error={errors.homeGroups?.[index]?.selectedHomes?.message}
                                                                    placeholder="Select care homes..."
                                                                />
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </div>

                                            {/* Rates for each role type */}
                                            <Tabs defaultValue="carer" className="w-full">
                                                <TabsList className="grid grid-cols-3 mb-4">
                                                    <TabsTrigger value="carer">Carer</TabsTrigger>
                                                    <TabsTrigger value="senior-carer">Senior Carer</TabsTrigger>
                                                    <TabsTrigger value="nurse">Nurse</TabsTrigger>
                                                </TabsList>

                                                {/* Carer Rates */}
                                                <TabsContent value="carer" className="space-y-6 bg-background rounded-md p-4">
                                                    <div className="space-y-4">
                                                        <h5 className="text-sm font-medium text-muted-foreground">Emergency Rates</h5>
                                                        {renderRateFields(index, 'carerRates', true)}
                                                    </div>
                                                </TabsContent>

                                                {/* Senior Carer Rates */}
                                                <TabsContent value="senior-carer" className="space-y-6 bg-background rounded-md p-4">
                                                    <div className="space-y-4">
                                                        <h5 className="text-sm font-medium text-muted-foreground">Standard Rates</h5>
                                                        {renderRateFields(index, 'seniorCarerRates', false)}
                                                    </div>

                                                    <Separator />

                                                    <div className="space-y-4">
                                                        <h5 className="text-sm font-medium text-muted-foreground">Emergency Rates</h5>
                                                        {renderRateFields(index, 'seniorCarerRates', true)}
                                                    </div>
                                                </TabsContent>

                                                {/* Nurse Rates */}
                                                <TabsContent value="nurse" className="space-y-6 bg-background rounded-md p-4">
                                                    <div className="space-y-4">
                                                        <h5 className="text-sm font-medium text-muted-foreground">Standard Rates</h5>
                                                        {renderRateFields(index, 'nurseRates', false)}
                                                    </div>

                                                    <Separator />

                                                    <div className="space-y-4">
                                                        <h5 className="text-sm font-medium text-muted-foreground">Emergency Rates</h5>
                                                        {renderRateFields(index, 'nurseRates', true)}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
                                        </div>

                                        {isEditing && homeGroupFields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeHomeGroup(index)}
                                                className="mt-4 text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2Icon className="h-4 w-4 mr-2" />
                                                Remove Home Group
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => appendHomeGroup({
                                        selectedHomes: [],
                                        rates: { ...defaultRates }
                                    })}
                                    className="w-full"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Another Home Group
                                </Button>
                            )}
                        </div>



                        {/* User Type Specific Rates */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium">Staff Payment Rates / Hour</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Rates paid by agency to staff members across all care homes</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Badge variant="outline" className="font-normal">Agency → Staff</Badge>
                            </div>

                            <Card>
                                <CardContent className="pt-6">
                                    <Tabs defaultValue="carer" className="w-full">
                                        <TabsList className="grid grid-cols-3 mb-4">
                                            <TabsTrigger value="carer">Carer</TabsTrigger>
                                            <TabsTrigger value="senior-carer">Senior Carer</TabsTrigger>
                                            <TabsTrigger value="nurse">Nurse</TabsTrigger>
                                        </TabsList>

                                        {userTypes.map((userType, index) => (
                                            <TabsContent
                                                key={userType}
                                                value={userType === 'senior_carer' ? 'senior-carer' : userType}
                                                className="space-y-6 bg-background rounded-md p-4"
                                            >
                                                <div className="space-y-4">
                                                    <h5 className="text-sm font-medium text-muted-foreground">Standard Rates</h5>
                                                    {renderUserTypeRateFields(index, false)}
                                                </div>

                                                <Separator />

                                                <div className="space-y-4">
                                                    <h5 className="text-sm font-medium text-muted-foreground">Emergency Rates</h5>
                                                    {renderUserTypeRateFields(index, true)}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {isEditing && (
                        <Button type="button" onClick={handleSubmit(handleSaveShiftPattern)}>
                            Save Changes
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AgencyShiftPatternDialog;