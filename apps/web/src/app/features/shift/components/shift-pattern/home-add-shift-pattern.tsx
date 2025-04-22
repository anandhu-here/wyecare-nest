"use client"

import React, { useState, useEffect } from 'react'
import { useForm, SubmitHandler, Controller, useFieldArray } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { IShiftPattern } from '@wyecare-monorepo/shared-types'

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
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    PencilIcon,
    Trash2Icon,
    PlusIcon,
    XIcon,
    ClockIcon,
    CoffeeIcon,
    DollarSignIcon,
    InfoIcon
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { selectCurrentOrganization } from '@/app/features/auth/AuthSlice'
import { TimeSelect } from '@/components/ui/time-select'
import { useCreateShiftPatternMutation, useUpdateShiftPatternMutation } from '@/app/features/shift-pattern/shiftPatternsApi'
import { toast } from 'react-toastify'

interface TimingGroup {
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

interface FormData {
    name: string;
    timingGroups: TimingGroup[];
    userTypeRates: UserTypeRate[];
}

interface ShiftTypeDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (shiftType: IShiftPattern) => void;
    selectedShiftType?: IShiftPattern | null;
}

const userTypes = ['Carer', 'Senior Carer', 'Nurse'];

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

const ShiftTypeDialog: React.FC<ShiftTypeDialogProps> = ({
    open,
    onClose,
    onSave,
    selectedShiftType
}) => {

    const [createShiftPattern, { isLoading: isCreating }] = useCreateShiftPatternMutation();
    const [updateShiftPattern, { isLoading: isUpdating }] = useUpdateShiftPatternMutation();


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
            timingGroups: [{
                startTime: '',
                endTime: '',
                billableHours: null,
                breakHours: null
            }],
            userTypeRates: userTypes.map((userType) => ({
                userType,
                weekdayRate: 0,
                weekendRate: 0,
                holidayRate: 0,
                emergencyWeekdayRate: 0,
                emergencyWeekendRate: 0,
                emergencyHolidayRate: 0
            }))
        }
    });

    const {
        fields: timingGroupFields,
        append: appendTimingGroup,
        remove: removeTimingGroup
    } = useFieldArray({ control, name: 'timingGroups' });

    const [isEditing, setIsEditing] = useState(false);
    const dispatch = useDispatch();
    const currentOrganization = useSelector(selectCurrentOrganization);

    // Watch timing groups to calculate shift durations
    const watchedTimingGroups = watch('timingGroups');

    useEffect(() => {
        if (open) {
            if (selectedShiftType) {
                populateForm(selectedShiftType);
                setIsEditing(false);
            } else {
                reset();
                setIsEditing(true);
            }
        }
    }, [open, selectedShiftType, reset]);

    // Calculate shift duration for each timing group
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

    const populateForm = (shiftType: IShiftPattern) => {
        setValue('name', shiftType.name);

        // Set timings with billable and break hours if they exist
        setValue(
            'timingGroups',
            shiftType.timings?.map((timing) => ({
                startTime: timing.startTime,
                endTime: timing.endTime,
                billableHours: timing.billableHours || null,
                breakHours: timing.breakHours || null
            })) || [{
                startTime: '',
                endTime: '',
                billableHours: null,
                breakHours: null
            }]
        );

        setValue('userTypeRates', shiftType.userTypeRates as any || userTypes.map((userType) => ({
            userType,
            weekdayRate: 0,
            weekendRate: 0,
            holidayRate: 0,
            emergencyWeekdayRate: 0,
            emergencyWeekendRate: 0,
            emergencyHolidayRate: 0
        })));
    };

    const handleSaveShiftType: SubmitHandler<FormData> = async (data) => {
        try {
            const newShiftType: IShiftPattern = {
                ...(selectedShiftType?._id ? { _id: selectedShiftType._id } : {} as any),
                name: data.name,
                userId: selectedShiftType?.userId || currentOrganization?._id || '',
                timings: data.timingGroups.map((group) => ({
                    careHomeId: currentOrganization?._id || '',
                    startTime: group.startTime,
                    endTime: group.endTime,
                    billableHours: group.billableHours || undefined,
                    breakHours: group.breakHours || undefined
                })),
                userTypeRates: data.userTypeRates
            } as IShiftPattern;

            if (selectedShiftType?._id) {
                await updateShiftPattern({
                    id: selectedShiftType._id.toString(),
                    data: newShiftType
                }).unwrap();
                toast.success('Shift pattern updated successfully');
            } else {
                await createShiftPattern(newShiftType).unwrap();
                toast.success('Shift pattern created successfully');
            }

            reset();
            setIsEditing(false);
            onClose();
        } catch (error: any) {
            console.error('Error saving shift type:', error);
            toast.error(error?.data?.message || 'Failed to save shift pattern');
        }
    };

    const renderRateFields = (index: number, isEmergency: boolean = false) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
                name={`userTypeRates.${index}.${isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekday' : 'Weekday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field }) => (
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
                                className={`pl-8 ${errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate']
                                    ? 'border-destructive'
                                    : ''}`}
                            />
                        </div>
                        {errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate'] && (
                            <p className="text-xs text-destructive">
                                {errors.userTypeRates[index]?.[isEmergency ? 'emergencyWeekdayRate' : 'weekdayRate']?.message}
                            </p>
                        )}
                    </div>
                )}
            />
            <Controller
                name={`userTypeRates.${index}.${isEmergency ? 'emergencyWeekendRate' : 'weekendRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency weekend' : 'Weekend'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field }) => (
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
                                className={`pl-8 ${errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyWeekendRate' : 'weekendRate']
                                    ? 'border-destructive'
                                    : ''}`}
                            />
                        </div>
                        {errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyWeekendRate' : 'weekendRate'] && (
                            <p className="text-xs text-destructive">
                                {errors.userTypeRates[index]?.[isEmergency ? 'emergencyWeekendRate' : 'weekendRate']?.message}
                            </p>
                        )}
                    </div>
                )}
            />
            <Controller
                name={`userTypeRates.${index}.${isEmergency ? 'emergencyHolidayRate' : 'holidayRate'}`}
                control={control}
                rules={{
                    required: `${isEmergency ? 'Emergency holiday' : 'Holiday'} rate is required`,
                    min: { value: 0, message: 'Rate must be non-negative' }
                }}
                render={({ field }) => (
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
                                className={`pl-8 ${errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyHolidayRate' : 'holidayRate']
                                    ? 'border-destructive'
                                    : ''}`}
                            />
                        </div>
                        {errors.userTypeRates?.[index]?.[isEmergency ? 'emergencyHolidayRate' : 'holidayRate'] && (
                            <p className="text-xs text-destructive">
                                {errors.userTypeRates[index]?.[isEmergency ? 'emergencyHolidayRate' : 'holidayRate']?.message}
                            </p>
                        )}
                    </div>
                )}
            />
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl">
                            {selectedShiftType
                                ? isEditing
                                    ? 'Edit Shift Pattern'
                                    : 'View Shift Pattern'
                                : 'Add Shift Pattern'}
                        </DialogTitle>
                        {selectedShiftType && !isEditing && (
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

                <ScrollArea className="flex-1 max-h-[calc(90vh-10rem)] overflow-y-auto">
                    <form onSubmit={handleSubmit(handleSaveShiftType)} className="space-y-6 px-6 py-4">
                        {/* Shift Pattern Name Section */}
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
                                        />
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Shift Timings Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Shift Timings</h3>
                            <div className="space-y-4">
                                {timingGroupFields.map((field, index) => {
                                    const shiftDuration = shiftDurations[index];
                                    const maxHours = shiftDuration?.durationHours || 0;
                                    const breakHours = watchedTimingGroups[index]?.breakHours || 0;
                                    const maxBillableHours = Math.max(0, maxHours - breakHours);

                                    return (
                                        <Card key={field.id}>
                                            <CardContent className="pt-6 relative">
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
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                                                    <div className="mt-2 mb-4">
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
                                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
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
                                        onClick={() => appendTimingGroup({
                                            startTime: '',
                                            endTime: '',
                                            billableHours: null,
                                            breakHours: null
                                        })}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Add Another Timing
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* User Type Rates Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Staff Payment Rates / Hour</h3>

                            <Card>
                                <CardContent className="pt-6">
                                    <Tabs defaultValue="carer" className="w-full">
                                        <TabsList className="grid grid-cols-3 mb-6">
                                            {userTypes.map((userType, index) => (
                                                <TabsTrigger key={userType} value={userType.toLowerCase().replace(' ', '-')}>
                                                    {userType}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        {userTypes.map((userType, index) => (
                                            <TabsContent key={userType} value={userType.toLowerCase().replace(' ', '-')} className="space-y-6">
                                                {/* Standard Rates */}
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-medium text-muted-foreground">Standard Rates</h4>
                                                    {renderRateFields(index, false)}
                                                </div>

                                                <Separator />

                                                {/* Emergency Rates */}
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-medium text-muted-foreground">Emergency Rates</h4>
                                                    {renderRateFields(index, true)}
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
                <div className="px-6 py-4 border-t flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {isEditing && (
                        <Button type="button" onClick={handleSubmit(handleSaveShiftType)}>
                            Save Changes
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShiftTypeDialog;