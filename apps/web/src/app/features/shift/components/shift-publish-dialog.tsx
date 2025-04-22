import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { useForm, useFieldArray, Controller } from 'react-hook-form';




// shadcn imports
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Icons
import {
    PlusIcon,
    UsersIcon,
    UserPlusIcon,
    TrashIcon,
    InfoIcon,
    Loader2,
    AlertTriangle,
    HelpCircle
} from 'lucide-react';

// Types
import { IShiftPattern } from '@wyecare-monorepo/shared-types';
import { selectCurrentOrganization } from '../../auth/AuthSlice';
import { useCreateMultipleShiftsMutation, useUpdateShiftMutation } from '../shiftApi';
import { useGetOtherOrganizationShiftPatternsQuery, useGetShiftPatternsQuery } from '../../shift-pattern/shiftPatternsApi';
import { useGetLinkedOrganizationsQuery } from '../../organization/organizationApi';
import { toast } from 'react-toastify';
import ShiftTypeDialog from './shift-pattern/home-add-shift-pattern';

// Commented out components that will be implemented later
// import AssignStaffDialog from './calendar-views/assign-staffs';
// import PreferredStaffDialog from './calendar-views/preferred-staffs';

// Interface for ShiftFormData
interface ShiftFormData {
    selectedAgency: string;
    isEmergency: boolean;
    shifts: {
        shiftPatternId: string;
        count: number | string;
        assignedStaff: string[];
        genderPreference: {
            male: number | string;
            female: number | string;
        };
        preferredStaff: string[];
        nursePreference: {
            count: number | string;
            classification?: string;
        };
    }[];
    duplicationType: string;
    nextNDays: number | string;
    skipDays: number | string;
}

interface IntegratedShiftDialogProps {
    open: boolean;
    onClose: () => void;
    selectedDate: moment.Moment | null;
    onAddShift?: (newShifts: any[]) => void;
    onEditShift?: (updatedShift: any) => void;
    shiftToEdit?: any | null;
    onClickCreateShiftType: () => void;
    isEditMode?: boolean;
}

const IntegratedShiftDialog = ({
    open,
    onClose,
    selectedDate,
    onAddShift,
    onEditShift,
    shiftToEdit,
    onClickCreateShiftType,
    isEditMode = false
}: IntegratedShiftDialogProps) => {
    // State management
    const [openShiftTypeDialog, setOpenShiftTypeDialog] = useState(false);
    const [currentShiftPattern, setCurrentShiftPattern] = useState<IShiftPattern | null>(null);
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);


    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [totalShiftCount, setTotalShiftCount] = useState(0);
    const [remainingDaysInMonth, setRemainingDaysInMonth] = useState(0);
    const [shiftPatterns, setShiftPatterns] = useState<IShiftPattern[]>([]);
    const [currentShiftIndex, setCurrentShiftIndex] = useState<number | null>(null);

    // Dialogs state
    const [openAssignStaffDialog, setOpenAssignStaffDialog] = useState(false);
    const [openPreferredStaffDialog, setOpenPreferredStaffDialog] = useState(false);

    const dispatch = useDispatch();

    // Get current organization from Redux store
    const currentOrganization = useSelector(selectCurrentOrganization);

    const { refetch: refetchShiftPatterns } = useGetShiftPatternsQuery(undefined);


    const handleCreateShiftType = () => {
        setOpenShiftTypeDialog(true);
        // Store current dialog state if needed
        setIsShiftDialogOpen(false); // Hide the shift dialog while creating a pattern
    };
    const handleShiftPatternCreated = async () => {
        await refetchShiftPatterns();
        setOpenShiftTypeDialog(false);
        setIsShiftDialogOpen(true); // Show shift dialog again
    };

    // React Hook Form setup
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        trigger,
        formState: { errors, isSubmitting }
    } = useForm<ShiftFormData>({
        defaultValues: {
            selectedAgency: 'internal',
            isEmergency: false,
            shifts: [{
                shiftPatternId: '',
                count: 1,
                assignedStaff: [],
                genderPreference: {
                    male: 0,
                    female: 0
                },
                nursePreference: {
                    count: 0,
                    classification: 'NA'
                },
                preferredStaff: []
            }],
            duplicationType: 'none',
            nextNDays: 1,
            skipDays: 0
        },
        mode: 'onChange'
    });

    // RTK Query hooks
    const [createMultipleShifts, { isLoading: isPublishingMultiple }] = useCreateMultipleShiftsMutation();
    const [updateShift, { isLoading: updateShiftLoading }] = useUpdateShiftMutation();

    const selectedAgency = watch('selectedAgency');
    const duplicationType = watch('duplicationType');
    const shifts = watch('shifts');

    const isPublishing = isPublishingMultiple || updateShiftLoading;

    // Get shift patterns based on organization type
    const { data: yourShiftPatterns, refetch: refetchYourShiftPatterns } = useGetShiftPatternsQuery(undefined, {
        skip: !open || selectedAgency !== 'internal'
    });

    // Get shift patterns from other organizations (agencies)
    const { data: otherShiftPatterns, refetch: refetchOtherShiftPatterns } = useGetOtherOrganizationShiftPatternsQuery(
        selectedAgency,
        { skip: !open || selectedAgency === 'internal' || !selectedAgency }
    );

    // Get linked organizations
    const { data: linkedOrgs } = useGetLinkedOrganizationsQuery(undefined, {
        skip: !open || currentOrganization?.type !== 'home'
    });

    // React Hook Form field array
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'shifts'
    });

    // Parse string input to number or empty string
    const parseNumberInput = (value: string) => {
        if (value === '') return '';
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? '' : parsed;
    };

    // Validate shift allocations
    const validateShiftAllocations = useCallback(() => {
        // Validation errors array
        const newErrors: string[] = [];

        // Check each shift's constraints
        shifts.forEach((shift, index) => {
            const shiftCount = Number(shift.count) || 0;
            const maleCount = Number(shift.genderPreference?.male) || 0;
            const femaleCount = Number(shift.genderPreference?.female) || 0;
            const nurseCount = Number(shift.nursePreference?.count) || 0;
            const totalGenderPreference = maleCount + femaleCount;

            // IMPORTANT: Check the total of ALL preferences
            const totalAllocatedStaff = maleCount + femaleCount + nurseCount;

            // Check individual counts first
            if (maleCount > shiftCount) {
                newErrors.push(`Shift ${index + 1}: Male count (${maleCount}) exceeds shift count (${shiftCount})`);
            }

            if (femaleCount > shiftCount) {
                newErrors.push(`Shift ${index + 1}: Female count (${femaleCount}) exceeds shift count (${shiftCount})`);
            }

            if (nurseCount > shiftCount) {
                newErrors.push(`Shift ${index + 1}: Nurse count (${nurseCount}) exceeds shift count (${shiftCount})`);
            }

            // Check gender total
            if (totalGenderPreference > shiftCount) {
                newErrors.push(`Shift ${index + 1}: Total gender preferences (${totalGenderPreference}) exceed shift count (${shiftCount})`);
            }

            // Check COMBINED total of all preferences
            if (totalAllocatedStaff > shiftCount) {
                newErrors.push(`Shift ${index + 1}: Total allocated staff (${maleCount} males + ${femaleCount} females + ${nurseCount} nurses = ${totalAllocatedStaff}) exceeds shift count (${shiftCount})`);
            }
        });

        setValidationErrors(newErrors);
        return newErrors.length === 0;
    }, [shifts]);

    // Calculate total shift count and validate
    useEffect(() => {
        // Calculate total shift count
        const newTotalCount = shifts.reduce((sum, shift) => sum + (Number(shift.count) || 0), 0);
        setTotalShiftCount(newTotalCount);

        // Only validate if validation is enabled
        if (showValidationErrors) {
            validateShiftAllocations();
        }
    }, [shifts, showValidationErrors, validateShiftAllocations]);

    // Calculate remaining days in month
    useEffect(() => {
        if (selectedDate) {
            const endOfMonth = selectedDate.clone().endOf('month');
            const daysRemaining = endOfMonth.diff(selectedDate, 'days') + 1;
            setRemainingDaysInMonth(daysRemaining);
        }
    }, [selectedDate]);

    // Reset form when component is unmounted
    useEffect(() => {
        return () => {
            reset({
                selectedAgency: 'internal',
                isEmergency: false,
                shifts: [{
                    shiftPatternId: '',
                    count: 1,
                    assignedStaff: [],
                    genderPreference: {
                        male: 0,
                        female: 0
                    },
                    preferredStaff: [],
                    nursePreference: {
                        count: 0,
                        classification: 'NA'
                    }
                }],
                duplicationType: 'none',
                nextNDays: 1,
                skipDays: 0
            });
            setShowValidationErrors(false);
        }
    }, []);

    // Set shift patterns based on selected agency
    useEffect(() => {
        if (selectedAgency === 'internal') {
            setShiftPatterns(yourShiftPatterns || []);
        } else {
            setShiftPatterns(otherShiftPatterns || []);
        }
    }, [selectedAgency, yourShiftPatterns, otherShiftPatterns]);

    // Initialize form values when dialog opens or when editing a shift
    useEffect(() => {
        if (open) {
            setShowValidationErrors(false);

            if (isEditMode && shiftToEdit) {
                // For editing an existing shift
                reset({
                    selectedAgency: shiftToEdit.agentId?._id || 'internal',
                    isEmergency: shiftToEdit.isEmergency || false,
                    shifts: [{
                        shiftPatternId: shiftToEdit.shiftPattern?._id || '',
                        count: shiftToEdit.count || 1,
                        assignedStaff: shiftToEdit.assignedUsers || [],
                        genderPreference: {
                            male: shiftToEdit.genderPreference?.male || 0,
                            female: shiftToEdit.genderPreference?.female || 0
                        },
                        preferredStaff: shiftToEdit.preferredStaff || [],
                        nursePreference: {
                            count: shiftToEdit.nursePreference?.count || 0,
                            classification: shiftToEdit.nursePreference?.classification || 'NA'
                        }
                    }],
                    duplicationType: 'none',
                    nextNDays: 1,
                    skipDays: 0
                });
            } else if (!isEditMode) {
                // For adding a new shift
                reset({
                    selectedAgency: 'internal',
                    isEmergency: false,
                    shifts: [{
                        shiftPatternId: '',
                        count: 1,
                        assignedStaff: [],
                        genderPreference: {
                            male: 0,
                            female: 0
                        },
                        preferredStaff: [],
                        nursePreference: {
                            count: 0,
                            classification: 'NA'
                        }
                    }],
                    duplicationType: 'none',
                    nextNDays: 1,
                    skipDays: 0
                });
            }
        }
    }, [open, isEditMode, shiftToEdit, reset]);

    // Handle form submission for adding shifts
    const handleAddShift = async (data: ShiftFormData) => {
        setShowValidationErrors(true);

        if (!validateShiftAllocations()) {
            toast.error('Please correct validation errors');
            return;
        }

        if (selectedDate) {
            const shiftsToAdd: any[] = [];
            let currentDate = selectedDate.clone();
            let daysToAdd = 1;

            switch (data.duplicationType) {
                case 'nextNDays': daysToAdd = Number(data.nextNDays); break;
                case 'remainingMonth': daysToAdd = remainingDaysInMonth; break;
                case 'wholeMonthSkip':
                    daysToAdd = remainingDaysInMonth - Number(data.skipDays);
                    currentDate = currentDate.add(Number(data.skipDays), 'days');
                    break;
            }

            const createShiftsForDate = (date: moment.Moment) => {
                // Consolidate shifts with same pattern
                const consolidatedShifts = data.shifts.reduce((acc: any[], shift) => {
                    const existingShift = acc.find(s => s.shiftPattern === shift.shiftPatternId);

                    if (existingShift) {
                        // Convert to numbers before adding
                        existingShift.count = Number(existingShift.count) + Number(shift.count);
                        existingShift.assignedUsers = [...new Set([...existingShift.assignedUsers, ...shift.assignedStaff])];
                        existingShift.preferredStaff = [...new Set([...existingShift.preferredStaff, ...shift.preferredStaff])];

                        if (shift.genderPreference) {
                            existingShift.genderPreference.male = Number(existingShift.genderPreference.male) + Number(shift.genderPreference.male);
                            existingShift.genderPreference.female = Number(existingShift.genderPreference.female) + Number(shift.genderPreference.female);
                        }

                        if (shift.nursePreference) {
                            existingShift.nursePreference.count = Number(existingShift.nursePreference.count) + Number(shift.nursePreference.count);
                        }
                    } else {
                        acc.push({
                            date: date.format('YYYY-MM-DD'),
                            count: Number(shift.count),
                            isEmergency: data.isEmergency,
                            shiftPattern: shift.shiftPatternId,
                            agentId: data.selectedAgency === 'internal' ? null : data.selectedAgency,
                            assignedUsers: shift.assignedStaff,
                            homeId: currentOrganization?._id,
                            genderPreference: data.selectedAgency !== 'internal' ? {
                                male: Number(shift.genderPreference.male),
                                female: Number(shift.genderPreference.female)
                            } : undefined,
                            nursePreference: {
                                count: Number(shift.nursePreference?.count || 0),
                                classification: shift.nursePreference?.classification || 'NA'
                            },
                            preferredStaff: data.selectedAgency !== 'internal' ? shift.preferredStaff : undefined,
                        });
                    }
                    return acc;
                }, []);

                return consolidatedShifts;
            };

            for (let i = 0; i < daysToAdd; i++) {
                shiftsToAdd.push(...createShiftsForDate(currentDate));
                currentDate = currentDate.clone().add(1, 'day');
            }

            try {
                const response = await createMultipleShifts({
                    shifts: shiftsToAdd,
                    needsApproval: data.selectedAgency !== 'internal'
                }).unwrap();

                toast.success('Shifts added successfully');
                if (onAddShift) onAddShift(response);
                onClose();
            } catch (error: any) {
                console.error('Error adding shifts:', error);
                toast.error(error.data?.message || 'Error adding shifts');
            }
        }
    };

    // Handle form submission for editing shifts
    const handleEditShift = async (data: ShiftFormData) => {
        setShowValidationErrors(true);

        if (!validateShiftAllocations()) {
            toast.error('Please correct validation errors');
            return;
        }

        if (!shiftToEdit) return;

        try {
            const updatedShiftData = {
                id: shiftToEdit._id,
                data: {
                    shiftPattern: data.shifts[0].shiftPatternId,
                    count: Number(data.shifts[0].count),
                    isEmergency: data.isEmergency,
                    agentId: data.selectedAgency === 'internal' ? null : data.selectedAgency,
                    assignedUsers: data.shifts[0].assignedStaff,
                    genderPreference: data.selectedAgency !== 'internal' ? {
                        male: Number(data.shifts[0].genderPreference.male),
                        female: Number(data.shifts[0].genderPreference.female)
                    } : undefined,
                    nursePreference: {
                        count: Number(data.shifts[0].nursePreference?.count || 0),
                        classification: data.shifts[0].nursePreference?.classification || 'NA'
                    },
                    preferredStaff: data.selectedAgency !== 'internal' ? data.shifts[0].preferredStaff : undefined
                }
            };

            const response = await updateShift(updatedShiftData).unwrap();
            toast.success('Shift updated successfully');
            if (onEditShift) onEditShift(response);
            onClose();
        } catch (error: any) {
            console.error('Error updating shift:', error);
            toast.error(error.data?.message || 'Error updating shift');
        }
    };

    // Combined submit handler
    const onSubmit = async (data: ShiftFormData) => {
        if (isEditMode) {
            await handleEditShift(data);
        } else {
            await handleAddShift(data);
        }
    };

    // Only render the dialog when open is true
    if (!open) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => {
                if (!isOpen) onClose();
            }}>
                <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="border-b p-6">
                        <DialogTitle className="text-xl font-semibold">
                            {isEditMode
                                ? 'Edit Shift'
                                : `Add Shift for ${selectedDate?.format('MMMM D, YYYY')}`}
                        </DialogTitle>
                        {!isEditMode && (
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Set up shift requirements and scheduling options
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-[calc(90vh-180px)]">
                                <div className="p-6 space-y-6">
                                    {showValidationErrors && validationErrors.length > 0 && (
                                        <Alert variant="destructive" className="mb-4 border-red-300 bg-red-50">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                            <AlertTitle className="text-red-800">Validation Errors</AlertTitle>
                                            <AlertDescription className="text-red-700">
                                                <ul className="list-disc pl-5 mt-2">
                                                    {validationErrors.map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Card className="shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Booking Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground">
                                                        Total Shifts: <span className="font-medium text-foreground">{totalShiftCount}</span>
                                                    </p>
                                                    {selectedDate && duplicationType !== 'none' && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Duration: <span className="font-medium text-foreground">
                                                                {duplicationType === 'nextNDays' && `${watch('nextNDays')} days`}
                                                                {duplicationType === 'remainingMonth' && `${remainingDaysInMonth} days (until end of month)`}
                                                                {duplicationType === 'wholeMonthSkip' && `${remainingDaysInMonth - Number(watch('skipDays'))} days`}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Emergency Shift Toggle */}
                                                <div className="flex items-center space-x-2">
                                                    <Label htmlFor="emergency-toggle" className="text-sm font-medium">
                                                        Emergency
                                                    </Label>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div>
                                                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="w-60">
                                                                <p>Mark as emergency to prioritize this shift request</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <Controller
                                                        name="isEmergency"
                                                        control={control}
                                                        render={({ field: { onChange, value } }) => (
                                                            <Switch
                                                                id="emergency-toggle"
                                                                checked={value}
                                                                onCheckedChange={onChange}
                                                                className={value ? "bg-red-600" : ""}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Agency Selection */}
                                    <Card className="shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Agency</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Controller
                                                name="selectedAgency"
                                                control={control}
                                                rules={{ required: 'Agency is required' }}
                                                render={({ field, fieldState }) => (
                                                    <div className="space-y-2">
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={isEditMode}
                                                        >
                                                            <SelectTrigger id="agency" className={
                                                                fieldState.error && showValidationErrors
                                                                    ? "border-red-500 ring-1 ring-red-500"
                                                                    : ""
                                                            }>
                                                                <SelectValue placeholder="Select Agency" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="internal">Internal</SelectItem>
                                                                {linkedOrgs?.data?.map((org) => (
                                                                    <SelectItem key={org._id} value={org._id}>
                                                                        {org.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {fieldState.error && showValidationErrors && (
                                                            <p className="text-sm text-red-500 mt-1">
                                                                {fieldState.error.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Shift Patterns */}
                                    <div className="mb-2">
                                        <h3 className="text-base font-medium">Shift Requirements</h3>
                                    </div>

                                    {fields.map((field, index) => (
                                        <Card key={field.id} className="shadow-sm border-slate-200 mb-4">
                                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                                <CardTitle className="text-sm font-medium">Shift {index + 1}</CardTitle>
                                                {!isEditMode && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:bg-red-50 h-8 w-8 rounded-full"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Controller
                                                            name={`shifts.${index}.shiftPatternId`}
                                                            control={control}
                                                            rules={{ required: 'Shift pattern is required' }}
                                                            render={({ field, fieldState }) => (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`shift-pattern-${index}`} className="text-sm font-medium">
                                                                        Shift Pattern
                                                                    </Label>
                                                                    <Select
                                                                        onValueChange={(value) => {
                                                                            if (value === "add_new") {
                                                                                handleCreateShiftType();
                                                                            } else {
                                                                                field.onChange(value);
                                                                            }
                                                                        }}
                                                                        value={field.value}
                                                                    >
                                                                        <SelectTrigger id={`shift-pattern-${index}`} className={
                                                                            fieldState.error && showValidationErrors
                                                                                ? "border-red-500 ring-1 ring-red-500"
                                                                                : ""
                                                                        }>
                                                                            <SelectValue placeholder="Select Pattern" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {shiftPatterns?.map((pattern) => {
                                                                                const timing = pattern.timings?.find(
                                                                                    (t) => t.careHomeId === currentOrganization?._id
                                                                                );

                                                                                if (!timing) {
                                                                                    return null;
                                                                                }
                                                                                return (
                                                                                    <SelectItem key={pattern._id.toString()} value={pattern._id.toString()}>
                                                                                        {pattern.name} ({timing?.startTime} - {timing?.endTime})
                                                                                    </SelectItem>
                                                                                );
                                                                            })}
                                                                            {selectedAgency === 'internal' && !isEditMode && (
                                                                                <SelectItem
                                                                                    value="add_new"
                                                                                    className="border-t border-gray-200 text-primary"
                                                                                >
                                                                                    + Add New Pattern
                                                                                </SelectItem>
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {fieldState.error && showValidationErrors && (
                                                                        <p className="text-sm text-red-500">
                                                                            {fieldState.error.message}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />

                                                        <Controller
                                                            name={`shifts.${index}.count`}
                                                            control={control}
                                                            rules={{
                                                                required: 'Count is required',
                                                                validate: value => Number(value) > 0 || 'Count must be greater than 0'
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`count-${index}`} className="text-sm font-medium">
                                                                        Number of Staff Required
                                                                    </Label>
                                                                    <Input
                                                                        id={`count-${index}`}
                                                                        type="number"
                                                                        inputMode="numeric"
                                                                        min="1"
                                                                        value={field.value}
                                                                        onChange={(e) => {
                                                                            // Allow empty string for backspacing
                                                                            if (e.target.value === '') {
                                                                                field.onChange('');
                                                                            } else {
                                                                                const parsedValue = parseNumberInput(e.target.value);
                                                                                field.onChange(parsedValue);

                                                                                // When count changes, ensure all dependent counts are adjusted
                                                                                const nurseCount = Number(shifts[index].nursePreference?.count) || 0;
                                                                                const maleCount = Number(shifts[index].genderPreference?.male) || 0;
                                                                                const femaleCount = Number(shifts[index].genderPreference?.female) || 0;

                                                                                // Only adjust if the new value is a number
                                                                                if (parsedValue !== '') {
                                                                                    const newCount = Number(parsedValue);

                                                                                    // First adjust individual counts that exceed the new total
                                                                                    let adjusted = false;

                                                                                    if (nurseCount > newCount) {
                                                                                        setValue(`shifts.${index}.nursePreference.count`, newCount);
                                                                                        adjusted = true;
                                                                                    }

                                                                                    if (maleCount > newCount) {
                                                                                        setValue(`shifts.${index}.genderPreference.male`, newCount);
                                                                                        adjusted = true;
                                                                                    }

                                                                                    if (femaleCount > newCount) {
                                                                                        setValue(`shifts.${index}.genderPreference.female`, newCount);
                                                                                        adjusted = true;
                                                                                    }

                                                                                    // Then handle the case where gender counts together exceed the total
                                                                                    if (maleCount + femaleCount > newCount) {
                                                                                        // If we haven't adjusted individual counts yet, do proportional adjustment
                                                                                        if (!adjusted && maleCount + femaleCount > 0) {
                                                                                            const maleRatio = maleCount / (maleCount + femaleCount);
                                                                                            setValue(`shifts.${index}.genderPreference.male`, Math.floor(newCount * maleRatio));
                                                                                            setValue(`shifts.${index}.genderPreference.female`, Math.ceil(newCount * (1 - maleRatio)));
                                                                                        }
                                                                                        // If we've already adjusted individual counts, we might need to fix the other gender
                                                                                        else if (adjusted) {
                                                                                            if (maleCount + femaleCount > newCount) {
                                                                                                if (maleCount === newCount) {
                                                                                                    setValue(`shifts.${index}.genderPreference.female`, 0);
                                                                                                } else if (femaleCount === newCount) {
                                                                                                    setValue(`shifts.${index}.genderPreference.male`, 0);
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            // If empty on blur, set to 1
                                                                            if (field.value === '') {
                                                                                field.onChange(1);
                                                                            }
                                                                        }}
                                                                        className={
                                                                            fieldState.error && showValidationErrors
                                                                                ? "border-red-500 ring-1 ring-red-500"
                                                                                : ""
                                                                        }
                                                                    />
                                                                    {fieldState.error && showValidationErrors && (
                                                                        <p className="text-sm text-red-500">
                                                                            {fieldState.error.message}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    </div>

                                                    {watch(`shifts.${index}.shiftPatternId`) && (
                                                        <>
                                                            <Separator className="my-2" />

                                                            {selectedAgency === 'internal' ? (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-sm font-medium">
                                                                            Assigned Staff ({shifts[index]?.assignedStaff?.length || 0} of {Number(shifts[index]?.count) || 0})
                                                                        </p>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            disabled={!watch(`shifts.${index}.shiftPatternId`)}
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setCurrentShiftIndex(index);
                                                                                setOpenAssignStaffDialog(true);
                                                                            }}
                                                                            className="h-8"
                                                                        >
                                                                            <UsersIcon className="h-4 w-4 mr-2" />
                                                                            Assign Staff
                                                                        </Button>
                                                                    </div>

                                                                    {shifts[index]?.assignedStaff?.length > 0 && (
                                                                        <div className="mt-2">
                                                                            <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
                                                                                {shifts[index]?.assignedStaff?.length} staff assigned
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="text-sm font-medium">Staff Requirements</h4>
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                                            <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p className="text-xs max-w-xs">
                                                                                            Specify staff requirements by gender and nurse qualification.
                                                                                            The total of all specified staff cannot exceed the total staff count.
                                                                                        </p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            <Controller
                                                                                name={`shifts.${index}.nursePreference.count`}
                                                                                control={control}
                                                                                render={({ field }) => (
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor={`nurses-${index}`} className="text-sm font-medium">
                                                                                            Required Nurses
                                                                                        </Label>
                                                                                        <Input
                                                                                            id={`nurses-${index}`}
                                                                                            type="number"
                                                                                            inputMode="numeric"
                                                                                            min="0"
                                                                                            max={Number(shifts[index].count) || 0}
                                                                                            placeholder="0"
                                                                                            value={field.value}
                                                                                            onChange={(e) => {
                                                                                                // Allow empty string for backspacing
                                                                                                if (e.target.value === '') {
                                                                                                    field.onChange('');
                                                                                                } else {
                                                                                                    const parsedValue = parseNumberInput(e.target.value);
                                                                                                    const maxValue = Number(shifts[index].count) || 0;
                                                                                                    const boundedValue = parsedValue === '' ? '' :
                                                                                                        Math.min(Math.max(0, parsedValue), maxValue);
                                                                                                    field.onChange(boundedValue);
                                                                                                }
                                                                                            }}
                                                                                            onBlur={() => {
                                                                                                // If empty on blur, set to 0
                                                                                                if (field.value === '') {
                                                                                                    field.onChange(0);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            />

                                                                            <Controller
                                                                                name={`shifts.${index}.genderPreference.male`}
                                                                                control={control}
                                                                                render={({ field }) => (
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor={`male-${index}`} className="text-sm font-medium">
                                                                                            Male Staff
                                                                                        </Label>
                                                                                        <Input
                                                                                            id={`male-${index}`}
                                                                                            type="number"
                                                                                            inputMode="numeric"
                                                                                            min="0"
                                                                                            max={Number(shifts[index].count) || 0}
                                                                                            placeholder="0"
                                                                                            value={field.value}
                                                                                            onChange={(e) => {
                                                                                                // Allow empty string for backspacing
                                                                                                if (e.target.value === '') {
                                                                                                    field.onChange('');
                                                                                                } else {
                                                                                                    const parsedValue = parseNumberInput(e.target.value);
                                                                                                    const maxValue = Number(shifts[index].count) || 0;
                                                                                                    const boundedValue = parsedValue === '' ? '' :
                                                                                                        Math.min(Math.max(0, parsedValue), maxValue);

                                                                                                    // Get current values for validation
                                                                                                    const femaleCount = Number(shifts[index].genderPreference?.female) || 0;
                                                                                                    const nursesCount = Number(shifts[index].nursePreference?.count) || 0;

                                                                                                    // If the total would exceed shift count, adjust female
                                                                                                    if (parsedValue !== '' && boundedValue + femaleCount + nursesCount > maxValue) {
                                                                                                        // Update both at once to prevent validation loops
                                                                                                        setValue(`shifts.${index}.genderPreference.male`, boundedValue);
                                                                                                        setValue(`shifts.${index}.genderPreference.female`, Math.max(0, maxValue - boundedValue - nursesCount));
                                                                                                    } else {
                                                                                                        // Just update male count
                                                                                                        field.onChange(boundedValue);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            onBlur={() => {
                                                                                                // If empty on blur, set to 0
                                                                                                if (field.value === '') {
                                                                                                    field.onChange(0);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            />

                                                                            <Controller
                                                                                name={`shifts.${index}.genderPreference.female`}
                                                                                control={control}
                                                                                render={({ field }) => (
                                                                                    <div className="space-y-2">
                                                                                        <Label htmlFor={`female-${index}`} className="text-sm font-medium">
                                                                                            Female Staff
                                                                                        </Label>
                                                                                        <Input
                                                                                            id={`female-${index}`}
                                                                                            type="number"
                                                                                            inputMode="numeric"
                                                                                            min="0"
                                                                                            max={Number(shifts[index].count) || 0}
                                                                                            placeholder="0"
                                                                                            value={field.value}
                                                                                            onChange={(e) => {
                                                                                                // Allow empty string for backspacing
                                                                                                if (e.target.value === '') {
                                                                                                    field.onChange('');
                                                                                                } else {
                                                                                                    const parsedValue = parseNumberInput(e.target.value);
                                                                                                    const maxValue = Number(shifts[index].count) || 0;
                                                                                                    const boundedValue = parsedValue === '' ? '' :
                                                                                                        Math.min(Math.max(0, parsedValue), maxValue);

                                                                                                    // Get current values for validation
                                                                                                    const maleCount = Number(shifts[index].genderPreference?.male) || 0;
                                                                                                    const nursesCount = Number(shifts[index].nursePreference?.count) || 0;

                                                                                                    // If the total would exceed shift count, adjust male
                                                                                                    if (parsedValue !== '' && boundedValue + maleCount + nursesCount > maxValue) {
                                                                                                        // Update both at once to prevent validation loops
                                                                                                        setValue(`shifts.${index}.genderPreference.female`, boundedValue);
                                                                                                        setValue(`shifts.${index}.genderPreference.male`, Math.max(0, maxValue - boundedValue - nursesCount));
                                                                                                    } else {
                                                                                                        // Just update female count
                                                                                                        field.onChange(boundedValue);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            onBlur={() => {
                                                                                                // If empty on blur, set to 0
                                                                                                if (field.value === '') {
                                                                                                    field.onChange(0);
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            />
                                                                        </div>

                                                                        <div className="mt-4">
                                                                            <div className="flex flex-col space-y-2">
                                                                                <Label htmlFor={`nurse-type-${index}`} className="text-sm font-medium">
                                                                                    Nurse Classification
                                                                                </Label>
                                                                                <Controller
                                                                                    name={`shifts.${index}.nursePreference.classification`}
                                                                                    control={control}
                                                                                    defaultValue="NA"
                                                                                    render={({ field }) => (
                                                                                        <Select
                                                                                            onValueChange={field.onChange}
                                                                                            value={field.value}
                                                                                            disabled={Number(shifts[index].nursePreference?.count) === 0}
                                                                                        >
                                                                                            <SelectTrigger id={`nurse-type-${index}`}>
                                                                                                <SelectValue placeholder="Select nurse type" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="RN">Registered Nurse (RN)</SelectItem>
                                                                                                <SelectItem value="EN">Enrolled Nurse (EN)</SelectItem>
                                                                                                <SelectItem value="NA">Nurse Assistant (NA)</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Preferred Staff */}
                                                                    <div>
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-sm font-medium">
                                                                                Preferred Staff ({shifts[index]?.preferredStaff?.length || 0} selected)
                                                                            </p>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setCurrentShiftIndex(index);
                                                                                    setOpenPreferredStaffDialog(true);
                                                                                }}
                                                                                className="h-8"
                                                                            >
                                                                                <UserPlusIcon className="h-4 w-4 mr-2" />
                                                                                {shifts[index]?.preferredStaff?.length > 0 ? 'Manage Staff' : 'Choose Staff'}
                                                                            </Button>
                                                                        </div>

                                                                        {shifts[index]?.preferredStaff?.length > 0 && (
                                                                            <div className="mt-2">
                                                                                <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">
                                                                                    {shifts[index]?.preferredStaff?.length} staff preferred
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {/* Add Pattern Button - Only for Add mode (not Edit) */}
                                    {!isEditMode && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-dashed border-2 h-14 mb-6"
                                            onClick={() => append({
                                                shiftPatternId: '',
                                                count: 1,
                                                assignedStaff: [],
                                                genderPreference: { male: 0, female: 0 },
                                                preferredStaff: [],
                                                nursePreference: { count: 0, classification: 'NA' }
                                            })}
                                        >
                                            <PlusIcon className="h-5 w-5 mr-2" />
                                            Add Another Shift Pattern
                                        </Button>
                                    )}

                                    {/* Duplication Controls - Only for Add mode (not Edit) */}
                                    {!isEditMode && (
                                        <Card className="shadow-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">Repeat Options</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <Controller
                                                        name="duplicationType"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="duplication-type" className="text-sm font-medium">
                                                                    Schedule Pattern
                                                                </Label>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <SelectTrigger id="duplication-type">
                                                                        <SelectValue placeholder="Select schedule pattern" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">Single day only</SelectItem>
                                                                        <SelectItem value="nextNDays">Repeat for next N days</SelectItem>
                                                                        <SelectItem value="remainingMonth">Repeat for remaining days in month</SelectItem>
                                                                        <SelectItem value="wholeMonthSkip">Repeat for month (skip N days)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    />

                                                    {duplicationType === 'nextNDays' && (
                                                        <Controller
                                                            name="nextNDays"
                                                            control={control}
                                                            rules={{ min: 1 }}
                                                            render={({ field, fieldState }) => (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="next-n-days" className="text-sm font-medium">
                                                                        Number of days
                                                                    </Label>
                                                                    <Input
                                                                        id="next-n-days"
                                                                        type="number"
                                                                        inputMode="numeric"
                                                                        min="1"
                                                                        value={field.value}
                                                                        onChange={(e) => {
                                                                            // Allow empty string for backspacing
                                                                            if (e.target.value === '') {
                                                                                field.onChange('');
                                                                            } else {
                                                                                const parsedValue = parseNumberInput(e.target.value);
                                                                                field.onChange(parsedValue);
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            // If empty on blur, set to 1
                                                                            if (field.value === '') {
                                                                                field.onChange(1);
                                                                            }
                                                                        }}
                                                                        className={
                                                                            fieldState.error && showValidationErrors
                                                                                ? "border-red-500 ring-1 ring-red-500"
                                                                                : ""
                                                                        }
                                                                    />
                                                                    {fieldState.error && showValidationErrors && (
                                                                        <p className="text-sm text-red-500">
                                                                            {fieldState.error.message}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    )}

                                                    {duplicationType === 'wholeMonthSkip' && (
                                                        <Controller
                                                            name="skipDays"
                                                            control={control}
                                                            rules={{ min: 0 }}
                                                            render={({ field, fieldState }) => (
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="skip-days" className="text-sm font-medium">
                                                                        Skip days
                                                                    </Label>
                                                                    <Input
                                                                        id="skip-days"
                                                                        type="number"
                                                                        inputMode="numeric"
                                                                        min="0"
                                                                        value={field.value}
                                                                        onChange={(e) => {
                                                                            // Allow empty string for backspacing
                                                                            if (e.target.value === '') {
                                                                                field.onChange('');
                                                                            } else {
                                                                                const parsedValue = parseNumberInput(e.target.value);
                                                                                field.onChange(parsedValue);
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            // If empty on blur, set to 0
                                                                            if (field.value === '') {
                                                                                field.onChange(0);
                                                                            }
                                                                        }}
                                                                        className={
                                                                            fieldState.error && showValidationErrors
                                                                                ? "border-red-500 ring-1 ring-red-500"
                                                                                : ""
                                                                        }
                                                                    />
                                                                    {fieldState.error && showValidationErrors && (
                                                                        <p className="text-sm text-red-500">
                                                                            {fieldState.error.message}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        />
                                                    )}

                                                    {duplicationType !== 'none' && (
                                                        <Alert variant="info" className="bg-blue-50 border-blue-200">
                                                            <InfoIcon className="h-4 w-4 text-blue-600" />
                                                            <AlertDescription className="text-sm text-blue-700">
                                                                {duplicationType === 'nextNDays' &&
                                                                    `This will create shifts for the next ${watch('nextNDays') || 1} days.`}
                                                                {duplicationType === 'remainingMonth' &&
                                                                    `This will create shifts for the remaining ${remainingDaysInMonth} days in this month.`}
                                                                {duplicationType === 'wholeMonthSkip' &&
                                                                    `This will create shifts for ${remainingDaysInMonth - (Number(watch('skipDays')) || 0)} days, starting after ${watch('skipDays') || 0} days.`}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter className="border-t p-4 mt-auto flex flex-row justify-between items-center">
                            <div>
                                {isSubmitting || isPublishing ? (
                                    <div className="text-sm text-muted-foreground flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {isEditMode ? 'Updating...' : 'Submitting...'}
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex space-x-2">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPublishing}
                                    className="min-w-[120px]"
                                >
                                    {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? 'Update Shift' : 'Add Shifts'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ShiftTypeDialog
                open={openShiftTypeDialog}
                onSave={() => { }}
                onClose={() => {
                    setOpenShiftTypeDialog(false);
                    setIsShiftDialogOpen(true); // Re-open the shift dialog
                }}
                selectedShiftType={null} // For creating a new pattern
            // No need for onSave prop as the component now handles saving itself
            />

            {/* Placeholder for staff assignment dialogs that will be implemented later */}
            {currentShiftIndex !== null && (
                <>
                    {/* AssignStaffDialog component will be implemented later */}
                    {/* <AssignStaffDialog
            open={openAssignStaffDialog}
            onClose={() => {
              setOpenAssignStaffDialog(false);
              setCurrentShiftIndex(null);
            }}
            selectedStaff={shifts[currentShiftIndex]?.assignedStaff || []}
            maxSelections={Number(shifts[currentShiftIndex]?.count) || 0}
            onConfirm={(selected) => {
              setValue(`shifts.${currentShiftIndex}.assignedStaff`, selected);
              setOpenAssignStaffDialog(false);
              setCurrentShiftIndex(null);
            }}
            shiftDetails={{
              date: selectedDate?.format('YYYY-MM-DD') || '',
              careHomeId: currentOrganization?._id || '',
              shiftPatternId: shifts[currentShiftIndex]?.shiftPatternId || ''
            }}
          /> */}

                    {/* PreferredStaffDialog component will be implemented later */}
                    {/* <PreferredStaffDialog
            open={openPreferredStaffDialog}
            onClose={() => {
              setOpenPreferredStaffDialog(false);
              setCurrentShiftIndex(null);
            }}
            agencyId={selectedAgency}
            selectedStaff={shifts[currentShiftIndex]?.preferredStaff || []}
            maxSelections={Number(shifts[currentShiftIndex]?.count) || 0}
            onConfirm={(selected) => {
              setValue(`shifts.${currentShiftIndex}.preferredStaff`, selected);
              setOpenPreferredStaffDialog(false);
              setCurrentShiftIndex(null);
            }}
          /> */}
                </>
            )}
        </>
    );
};

export default IntegratedShiftDialog;