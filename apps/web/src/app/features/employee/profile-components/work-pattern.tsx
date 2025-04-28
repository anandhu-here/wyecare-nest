import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Calendar, Loader2, CheckCircle2, Info, PlusCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGetEmployeeApplicationQuery, useUpdateSectionMutation } from '../employeeApplicationApi';
import { useDispatch } from 'react-redux';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'react-toastify';

interface WorkPatternSelectorProps {
    initialData?: Record<string, any>;
    onSubmit?: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface WorkPattern {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    defaultMin: number;
    defaultMax: number;
}

interface PatternOptionProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    isSelected: boolean;
    onClick: () => void;
}

interface HoursState {
    minHours: string;
    maxHours: string;
}

interface AvailabilityData {
    preferredWorkPattern?: string;
    minHoursPerWeek?: number;
    maxHoursPerWeek?: number;
}

/**
 * Work Pattern Selector Component
 * 
 * A component for choosing preferred work pattern and specifying hours
 * for Full-time, Part-time, or Flexible work schedules
 */
const WorkPatternSelector: React.FC<WorkPatternSelectorProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    userId,
    isViewedByYourOrg = false,
    editable = true
}) => {
    const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
    const [formInitialized, setFormInitialized] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [hours, setHours] = useState<HoursState>({
        minHours: '',
        maxHours: ''
    });
    const dispatch = useDispatch();

    // Get carer application data
    const {
        data: carerApplication,
        isLoading: isLoadingApplication
    } = useGetEmployeeApplicationQuery({
        carerId: userId
    }, {
        skip: isViewedByYourOrg,
        refetchOnMountOrArgChange: true
    });

    // Update carer application section mutation
    const [updateApplicationSection] = useUpdateSectionMutation();

    // Pattern information with detailed descriptions
    const patterns: WorkPattern[] = [
        {
            id: "Full-time",
            title: "Full-time",
            description: "Regular schedules, typically 35+ hours per week",
            icon: <Clock className="h-5 w-5" />,
            defaultMin: 35,
            defaultMax: 40
        },
        {
            id: "Part-time",
            title: "Part-time",
            description: "Regular schedules, typically under 35 hours per week",
            icon: <Calendar className="h-5 w-5" />,
            defaultMin: 15,
            defaultMax: 34
        },
        {
            id: "Flexible",
            title: "Flexible",
            description: "Variable schedules based on your availability",
            icon: <Clock className="h-5 w-5" />,
            defaultMin: 0,
            defaultMax: 40
        }
    ];

    // Convert object with numeric keys to regular object
    const processData = (data: any): AvailabilityData => {
        if (!data) return {};

        // For this component, we don't need to convert arrays since we're dealing with primitive values
        return {
            preferredWorkPattern: data.preferredWorkPattern || '',
            minHoursPerWeek: data.minHoursPerWeek !== undefined ? Number(data.minHoursPerWeek) : undefined,
            maxHoursPerWeek: data.maxHoursPerWeek !== undefined ? Number(data.maxHoursPerWeek) : undefined
        };
    };

    // Get the initial data based on source
    const availabilityData = useMemo<AvailabilityData>(() => {
        const data = editable
            ? carerApplication?.data[selectedSection]
            : initialData;

        return processData(data);
    }, [carerApplication?.data, selectedSection, editable, initialData]);

    // Effect to set initial values when data loads
    useEffect(() => {
        if (editable && carerApplication?.data[selectedSection]) {
            const data = processData(carerApplication.data[selectedSection]);

            if (data.preferredWorkPattern) {
                setSelectedPattern(data.preferredWorkPattern);
            }

            setHours({
                minHours: data.minHoursPerWeek !== undefined ? String(data.minHoursPerWeek) : '',
                maxHours: data.maxHoursPerWeek !== undefined ? String(data.maxHoursPerWeek) : ''
            });

            setFormInitialized(true);
        } else if (!editable && initialData) {
            const data = processData(initialData);

            if (data.preferredWorkPattern) {
                setSelectedPattern(data.preferredWorkPattern);
            }

            setHours({
                minHours: data.minHoursPerWeek !== undefined ? String(data.minHoursPerWeek) : '',
                maxHours: data.maxHoursPerWeek !== undefined ? String(data.maxHoursPerWeek) : ''
            });

            setFormInitialized(true);
        }
    }, [carerApplication?.data, selectedSection, editable, initialData]);

    // Set default hours when pattern changes
    const handlePatternSelect = (pattern: string) => {
        if (selectedPattern === pattern) return;

        setSelectedPattern(pattern);

        // Find the selected pattern object
        const patternObj = patterns.find(p => p.id === pattern);
        if (patternObj) {
            // If no hours were previously set, use defaults
            if (!hours.minHours && !hours.maxHours) {
                setHours({
                    minHours: String(patternObj.defaultMin),
                    maxHours: String(patternObj.defaultMax)
                });
            }
        }
    };

    // Handle hour input changes
    const handleHourChange = (field: keyof HoursState, value: string) => {
        // Only allow numeric input
        if (value === '' || /^\d+$/.test(value)) {
            setHours(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Validate hours before saving
    const validateHours = (): boolean => {
        const min = Number(hours.minHours);
        const max = Number(hours.maxHours);

        if (hours.minHours === '' || hours.maxHours === '') {
            toast.warning('Please specify both minimum and maximum hours');
            return false;
        }

        if (min > max) {
            toast.warning('Minimum hours cannot be greater than maximum hours');
            return false;
        }

        if (min < 0 || max > 168) {
            toast.warning('Hours must be between 0 and 168 (hours in a week)');
            return false;
        }

        return true;
    };

    // Save work pattern and hours
    const saveWorkPattern = async () => {
        if (!selectedPattern) {
            toast.warning('Please select a work pattern');
            return;
        }

        if (!validateHours()) {
            return;
        }

        setIsUpdating(true);
        try {
            await updateApplicationSection({
                section: `${selectedSection}`,
                data: {
                    preferredWorkPattern: selectedPattern,
                    minHoursPerWeek: Number(hours.minHours),
                    maxHoursPerWeek: Number(hours.maxHours)
                },
                carerId: userId
            }).unwrap();

            toast.success('Work pattern and hours updated successfully');
        } catch (error: any) {
            console.error('Error updating work pattern:', error);
            toast.error(`Failed to update work pattern: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="shadow-md border-gray-200 hover:border-primary-200 transition-colors duration-300">
            <CardContent className="pt-6 px-2">
                {isLoadingApplication ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading preferences...</span>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {/* Pattern Selection */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Select Work Pattern:</h3>
                                <div className="flex flex-col space-y-3">
                                    {patterns.map(pattern => (
                                        <PatternOption
                                            key={pattern.id}
                                            title={pattern.title}
                                            description={pattern.description}
                                            icon={pattern.icon}
                                            isSelected={selectedPattern === pattern.id}
                                            onClick={() => handlePatternSelect(pattern.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Hours Input */}
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Specify Weekly Hours:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="minHours">Minimum Hours</Label>
                                        <Input
                                            id="minHours"
                                            type="text"
                                            value={hours.minHours}
                                            onChange={(e) => handleHourChange('minHours', e.target.value)}
                                            placeholder="Min hours per week"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxHours">Maximum Hours</Label>
                                        <Input
                                            id="maxHours"
                                            type="text"
                                            value={hours.maxHours}
                                            onChange={(e) => handleHourChange('maxHours', e.target.value)}
                                            placeholder="Max hours per week"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Please specify the minimum and maximum hours you are willing to work each week.
                                </p>
                            </div>

                            {/* Save Button */}
                            <div className="pt-4">
                                <button
                                    onClick={saveWorkPattern}
                                    disabled={isUpdating}
                                    className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-70"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Save Work Pattern & Hours
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Info Section */}
                            <div className="text-sm text-muted-foreground flex items-start bg-blue-50 p-3 rounded-lg">
                                <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                <span>
                                    Your work pattern and hours help us match you with appropriate care assignments.
                                    You can update these preferences at any time as your availability changes.
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// Simplified pattern option without tooltip
const PatternOption: React.FC<PatternOptionProps> = ({
    title,
    description,
    icon,
    isSelected,
    onClick
}) => {
    return (
        <div
            className={`
                relative p-2 rounded-lg border cursor-pointer transition-all
                ${isSelected
                    ? 'border-primary bg-primary-50 dark:bg-primary-950 shadow-md'
                    : 'border-gray-200 hover:border-primary hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50'
                }
            `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-medium">{title}</h3>
                    </div>
                </div>

                {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
            </div>
        </div>
    );
};

export default WorkPatternSelector;