import React, { useState, useEffect, useMemo } from 'react';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, getDay,
    addDays, parseISO, subDays
} from 'date-fns';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sun, Moon, Info,
    ArrowRight, ArrowLeft, Loader2, RefreshCw, Home
} from 'lucide-react';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
    useCreateOrUpdateAvailabilityMutation,
    useGetCurrentUserAvailabilityQuery,
    useDeleteAvailabilityMutation,
    useUpdateAvailabilityMutation,
    useUpdateSingleDateAvailabilityMutation
} from '../employeeAvailabilityApi';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { AvailabilityPeriod } from '@wyecare-monorepo/shared-types';

interface AvailabilityCalendarProps {
    initialData?: Record<string, any>;
    onSubmit?: (data: any, index: number | undefined, section: string) => void;
    selectedSection: string;
    editable?: boolean;
    isViewedByYourOrg?: boolean;
    userId: string;
}

interface AvailabilityEntry {
    date: Date;
    period: AvailabilityPeriod | string;
    recordId?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
    initialData,
    onSubmit,
    selectedSection,
    userId,
    isViewedByYourOrg = false,
    editable = true
}) => {
    // Always start with today's date
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<"week" | "month">("week"); // "week" or "month"
    const [availability, setAvailability] = useState<AvailabilityEntry[]>([]); // [{date: Date, period: 'day' | 'night' | 'both'}]
    const [showHelp, setShowHelp] = useState<boolean>(true);
    const [mobileCurrentDay, setMobileCurrentDay] = useState<number>(0); // For mobile day navigation
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isUpdatingDate, setIsUpdatingDate] = useState<boolean>(false);
    const [updatingDateKey, setUpdatingDateKey] = useState<string | null>(null); // Track which date is being updated
    const [formInitialized, setFormInitialized] = useState<boolean>(false);

    // Get the number of days to display in mobile view
    const mobileDisplayCount = 3; // Show 3 days at a time on mobile

    // Calculate start and end dates for fetching
    const getDateRange = () => {
        let start: Date, end: Date;
        if (viewMode === "week") {
            start = startOfWeek(currentDate, { weekStartsOn: 1 });
            end = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else {
            start = startOfMonth(currentDate);
            end = endOfMonth(currentDate);
        }
        // Add some buffer days to handle navigation
        start = subDays(start, 7);
        end = addDays(end, 7);
        return { startDate: start, endDate: end };
    };

    const dispatch = useDispatch();

    const dateRange = getDateRange();

    // RTK Query hooks
    const [createOrUpdateAvailability, { isLoading: isCreating }] = useCreateOrUpdateAvailabilityMutation();
    const [deleteAvailability, { isLoading: isDeleting }] = useDeleteAvailabilityMutation();
    const [updateAvailability] = useUpdateAvailabilityMutation();
    const [updateSingleDateAvailability] = useUpdateSingleDateAvailabilityMutation();

    const {
        data: availabilityData,
        isLoading: isFetching,
        refetch
    } = useGetCurrentUserAvailabilityQuery({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
    }, {
        skip: !editable || isViewedByYourOrg,
        refetchOnMountOrArgChange: true
    });

    // Process initial data
    useEffect(() => {
        if (editable && availabilityData?.data) {
            // Extract availability entries from all records
            let allEntries: AvailabilityEntry[] = [];
            availabilityData.data.forEach(record => {
                if (record.availabilityEntries && record.availabilityEntries.length > 0) {
                    allEntries = [
                        ...allEntries,
                        ...record.availabilityEntries.map(entry => ({
                            date: typeof entry.date === 'string' ? parseISO(entry.date) : entry.date,
                            period: entry.period,
                            recordId: record._id // Keep track of which record this belongs to
                        }))
                    ];
                }
            });
            setAvailability(allEntries);
            setFormInitialized(true);
        } else if (!editable && initialData) {
            // Handle initialData for non-editable view
            let allEntries: AvailabilityEntry[] = [];
            if (initialData.availabilityEntries && initialData.availabilityEntries.length > 0) {
                allEntries = initialData.availabilityEntries.map((entry: any) => ({
                    date: typeof entry.date === 'string' ? parseISO(entry.date) : entry.date,
                    period: entry.period
                }));
            }
            setAvailability(allEntries);
            setFormInitialized(true);
        } else if (availabilityData?.data && availabilityData.data.length === 0) {
            // If we got data but it's empty, clear the availability
            setAvailability([]);
            setFormInitialized(true);
        }
    }, [availabilityData, initialData, editable]);

    // Handle refresh action
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            toast.success('Availability data refreshed');
        } catch (error: any) {
            toast.error(`Failed to refresh data: ${error.message}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Navigate to today
    const goToToday = () => {
        setCurrentDate(new Date());
        setMobileCurrentDay(0); // Reset mobile view
    };

    // Navigation functions
    const navigateNext = () => {
        if (viewMode === "week") {
            setCurrentDate(addWeeks(currentDate, 1));
            setMobileCurrentDay(0); // Reset mobile view to start of week
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const navigatePrev = () => {
        if (viewMode === "week") {
            setCurrentDate(subWeeks(currentDate, 1));
            setMobileCurrentDay(0); // Reset mobile view to start of week
        } else {
            setCurrentDate(subMonths(currentDate, 1));
        }
    };

    // Mobile day navigation
    const navigateNextDay = () => {
        if (mobileCurrentDay < getDaysToDisplay().length - mobileDisplayCount) {
            setMobileCurrentDay(mobileCurrentDay + 1);
        }
    };

    const navigatePrevDay = () => {
        if (mobileCurrentDay > 0) {
            setMobileCurrentDay(mobileCurrentDay - 1);
        }
    };

    // Get dates to display based on view mode
    const getDaysToDisplay = (): Date[] => {
        if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            return eachDayOfInterval({ start, end });
        }
    };

    // Get the subset of days to display in mobile view
    const getMobileDaysToDisplay = (): Date[] => {
        const allDays = getDaysToDisplay();
        if (viewMode === "week") {
            return allDays.slice(mobileCurrentDay, mobileCurrentDay + mobileDisplayCount);
        } else {
            return allDays;
        }
    };

    // Toggle availability for a date and period
    const toggleAvailability = async (date: Date, period: AvailabilityPeriod | string) => {
        if (!editable) return;

        const dateKey = format(date, 'yyyy-MM-dd');

        // Set the updating state and key
        setIsUpdatingDate(true);
        setUpdatingDateKey(dateKey);

        try {
            // Find existing entry for this date
            const existingEntry = availability.find(
                entry => format(entry.date, 'yyyy-MM-dd') === dateKey
            );

            let newPeriod: AvailabilityPeriod | string | null = null; // Default to removing

            if (!existingEntry) {
                // No existing entry, create with selected period
                newPeriod = period;
            } else if (existingEntry.period === period) {
                // If same period is clicked, remove it
                newPeriod = null;
            } else if (existingEntry.period === 'both') {
                // If 'both' is set and one period is clicked, keep only the other
                newPeriod = period === 'day' ? 'night' : 'day';
            } else if ((existingEntry.period === 'day' && period === 'night') ||
                (existingEntry.period === 'night' && period === 'day')) {
                // If we have day and click night (or vice versa), set to both
                newPeriod = 'both';
            }

            // Call the API to update this date
            await updateSingleDateAvailability({
                date: dateKey,
                period: newPeriod
            }).unwrap();

            // Update local state optimistically
            setAvailability(prev => {
                if (newPeriod === null) {
                    // Remove the entry
                    return prev.filter(entry => format(entry.date, 'yyyy-MM-dd') !== dateKey);
                } else if (existingEntry) {
                    // Update existing entry
                    return prev.map(entry =>
                        format(entry.date, 'yyyy-MM-dd') === dateKey
                            ? { ...entry, period: newPeriod }
                            : entry
                    );
                } else {
                    // Add new entry
                    return [...prev, { date: new Date(date), period: newPeriod }];
                }
            });

            // Show success notification on mobile (on desktop it might be too intrusive)
            if (window.innerWidth < 768) {
                toast.success('Availability updated');
            }
        } catch (error: any) {
            console.error('Error updating availability:', error);
            toast.error(`Failed to update availability: ${error.message}`);

            // Revert optimistic update by refreshing data
            refetch();
        } finally {
            setIsUpdatingDate(false);
            setUpdatingDateKey(null);
        }
    };

    // Clear availability for a date
    const clearAvailability = async (date: Date) => {
        if (!editable) return;

        const dateKey = format(date, 'yyyy-MM-dd');

        // Set updating state
        setIsUpdatingDate(true);
        setUpdatingDateKey(dateKey);

        try {
            // Call API to clear this date
            await updateSingleDateAvailability({
                date: dateKey,
                period: null
            }).unwrap();

            // Update local state optimistically
            setAvailability(prev =>
                prev.filter(entry => format(entry.date, 'yyyy-MM-dd') !== dateKey)
            );
        } catch (error: any) {
            console.error('Error clearing availability:', error);
            toast.error(`Failed to clear availability: ${error.message}`);

            // Revert optimistic update by refreshing data
            refetch();
        } finally {
            setIsUpdatingDate(false);
            setUpdatingDateKey(null);
        }
    };

    // Check availability status for a date and period
    const getAvailabilityStatus = (date: Date, period: AvailabilityPeriod | string): boolean => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const entry = availability.find(
            entry => format(entry.date, 'yyyy-MM-dd') === dateKey
        );

        if (!entry) return false;
        if (entry.period === 'both') return true;
        return entry.period === period;
    };

    // Check if a specific date is currently being updated
    const isDateUpdating = (date: Date): boolean => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return isUpdatingDate && updatingDateKey === dateKey;
    };

    // Update all availability (bulk update)
    const handleConfirm = async () => {
        if (!editable) return;

        try {
            setIsSubmitting(true);

            const availabilityEntries = availability.map(entry => ({
                date: format(entry.date, 'yyyy-MM-dd'),
                period: entry.period
            }));

            console.log('Sending availability entries:', availabilityEntries);

            const result = await updateAvailability({
                availabilityEntries,
                effectiveFrom: new Date().toISOString(),
                isRecurring: false,
            }).unwrap();

            toast.success('Availability saved successfully');

            // Refresh data to ensure UI is in sync with backend
            refetch();
        } catch (error: any) {
            console.error('Error saving availability:', error);
            toast.error(`Failed to save availability: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get week or month label for header
    const getHeaderLabel = (): string => {
        if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return format(currentDate, 'MMMM yyyy');
        }
    };

    // Get mobile header label
    const getMobileWeekHeaderLabel = (): string => {
        const allDays = getDaysToDisplay();
        if (viewMode === "week" && allDays.length > 0) {
            const startIdx = mobileCurrentDay;
            const endIdx = Math.min(mobileCurrentDay + mobileDisplayCount - 1, allDays.length - 1);
            return `${format(allDays[startIdx], 'MMM d')} - ${format(allDays[endIdx], 'MMM d')}`;
        }
        return getHeaderLabel();
    };

    // Create quick select for this week, next week, next month
    type QuickSelectOption = "thisWeek" | "nextWeek" | "nextMonth";

    const quickSelect = (option: QuickSelectOption) => {
        let newDate: Date;
        switch (option) {
            case "thisWeek":
                newDate = new Date();
                setViewMode("week");
                break;
            case "nextWeek":
                newDate = addWeeks(new Date(), 1);
                setViewMode("week");
                break;
            case "nextMonth":
                newDate = addMonths(new Date(), 1);
                setViewMode("month");
                break;
            default:
                newDate = new Date();
        }
        setCurrentDate(newDate);
        setMobileCurrentDay(0); // Reset mobile view
    };

    // Days of week for header labels
    const weekdays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Loading overlay
    const LoadingOverlay = () => (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-700">
                    {isRefreshing ? 'Refreshing data...' : 'Loading your availability...'}
                </p>
            </div>
        </div>
    );

    return (
        <div className="w-full px-0 sm:px-2 max-w-md mx-auto sm:max-w-xl md:max-w-4xl">
            {/* Help/Legend Section */}
            {showHelp && (
                <Card className="mb-4 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium flex items-center">
                                <Info className="h-5 w-5 mr-2 text-blue-500" />
                                How to Use
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHelp(false)}
                                className="h-8 text-gray-500"
                            >
                                Dismiss
                            </Button>
                        </div>

                        <p className="text-sm mb-3">
                            Mark when you're available for shifts. Changes are saved automatically.
                        </p>

                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-16 flex items-center mr-2">
                                    <Sun className="h-4 w-4 mr-1 text-gray-700" />
                                    <span>Day:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Available</Badge>
                                    <ArrowRight className="h-4 w-4 text-gray-500" />
                                    <Badge className="bg-green-500">Available</Badge>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <div className="w-16 flex items-center mr-2">
                                    <Moon className="h-4 w-4 mr-1 text-gray-700" />
                                    <span>Night:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Available</Badge>
                                    <ArrowRight className="h-4 w-4 text-gray-500" />
                                    <Badge className="bg-indigo-500">Available</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-lg overflow-hidden relative">
                {/* Show loading overlay when fetching or submitting */}
                {(isFetching || isSubmitting || isRefreshing) && <LoadingOverlay />}

                <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <CardTitle className="flex justify-between items-center">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={navigatePrev}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-lg font-medium hidden md:block">{getHeaderLabel()}</span>
                        <span className="text-lg font-medium md:hidden">{viewMode === "week" ? getMobileWeekHeaderLabel() : getHeaderLabel()}</span>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={navigateNext}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardTitle>
                </CardHeader>

                {/* View mode tabs */}
                <div className="px-4 pt-4">
                    <Tabs value={viewMode} onValueChange={(v: "week" | "month") => { setViewMode(v); setMobileCurrentDay(0); }} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Quick navigation buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => quickSelect("thisWeek")}>
                        This Week
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickSelect("nextWeek")}>
                        Next Week
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickSelect("nextMonth")}>
                        Next Month
                    </Button>

                    {/* Today button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={goToToday}
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                        <Home className="h-4 w-4 mr-1" />
                        Today
                    </Button>

                    {/* Refresh button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing || !editable}
                        className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    {!showHelp && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto"
                            onClick={() => setShowHelp(true)}
                        >
                            <Info className="h-4 w-4 mr-1" />
                            Help
                        </Button>
                    )}
                </div>

                {/* MOBILE VIEW - Special Day Navigation for Week View */}
                {viewMode === "week" && (
                    <div className="md:hidden flex justify-between items-center px-4 py-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={navigatePrevDay}
                            disabled={mobileCurrentDay === 0}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                        </Button>

                        <div className="text-sm font-medium text-center">
                            {`${mobileCurrentDay + 1}-${Math.min(mobileCurrentDay + mobileDisplayCount, getDaysToDisplay().length)} of ${getDaysToDisplay().length} days`}
                        </div>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={navigateNextDay}
                            disabled={mobileCurrentDay >= getDaysToDisplay().length - mobileDisplayCount}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}

                <CardContent className="p-2">
                    {/* MOBILE CALENDAR VIEW */}
                    <div className="block md:hidden">
                        {/* Mobile Week View */}
                        {viewMode === "week" && (
                            <div className="flex flex-col">
                                {/* Mobile week days - 3 at a time */}
                                <div className="grid grid-cols-3 gap-2">
                                    {getMobileDaysToDisplay().map((day, dayIdx) => {
                                        const isToday = isSameDay(day, new Date());
                                        const dayOfWeek = weekdays[getDay(day) === 0 ? 6 : getDay(day) - 1];
                                        const isThisDateUpdating = isDateUpdating(day);

                                        return (
                                            <div
                                                key={dayIdx}
                                                className={`
                                                  p-3 rounded-lg 
                                                  ${isToday ? "ring-2 ring-blue-500" : "border"}
                                                  flex flex-col h-40
                                                  transition-all duration-200
                                                  bg-white hover:shadow-md
                                                  ${isToday ? "shadow-md" : ""}
                                                  ${isThisDateUpdating ? "opacity-70" : ""}
                                                `}
                                            >
                                                <div className="flex flex-col items-center mb-3">
                                                    <div className="text-xs font-medium text-gray-500">{dayOfWeek}</div>
                                                    <div className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-gray-800"}`}>
                                                        {format(day, 'd')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{format(day, 'MMM')}</div>
                                                </div>

                                                <div className="flex flex-col gap-2 mt-auto">
                                                    <button
                                                        className={`
                                                          flex items-center justify-between py-1.5 px-2 rounded-md text-xs
                                                          transition-all duration-200 w-full
                                                          ${getAvailabilityStatus(day, 'day')
                                                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}
                                                          ${isThisDateUpdating ? "opacity-70 cursor-wait" : ""}
                                                          ${!editable ? "opacity-70 cursor-not-allowed" : ""}
                                                        `}
                                                        onClick={() => toggleAvailability(day, 'day')}
                                                        disabled={isThisDateUpdating || !editable}
                                                    >
                                                        <div className="flex items-center">
                                                            {isThisDateUpdating ? (
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Sun className="h-3 w-3 mr-1" />
                                                            )}
                                                            <span>Day</span>
                                                        </div>
                                                        {getAvailabilityStatus(day, 'day') && (
                                                            <div className="w-3 h-3 rounded-full bg-white/25 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>
                                                        )}
                                                    </button>

                                                    <button
                                                        className={`
                                                          flex items-center justify-between py-1.5 px-2 rounded-md text-xs
                                                          transition-all duration-200 w-full
                                                          ${getAvailabilityStatus(day, 'night')
                                                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm"
                                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}
                                                          ${isThisDateUpdating ? "opacity-70 cursor-wait" : ""}
                                                          ${!editable ? "opacity-70 cursor-not-allowed" : ""}
                                                        `}
                                                        onClick={() => toggleAvailability(day, 'night')}
                                                        disabled={isThisDateUpdating || !editable}
                                                    >
                                                        <div className="flex items-center">
                                                            {isThisDateUpdating ? (
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Moon className="h-3 w-3 mr-1" />
                                                            )}
                                                            <span>Night</span>
                                                        </div>
                                                        {getAvailabilityStatus(day, 'night') && (
                                                            <div className="w-3 h-3 rounded-full bg-white/25 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mobile Month View */}
                        {viewMode === "month" && (
                            <div>
                                {/* Month days header */}
                                <div className="grid grid-cols-7 mb-1">
                                    {weekdays.map((day, idx) => (
                                        <div key={idx} className="text-center text-xs font-medium text-gray-500">
                                            {day.substring(0, 1)}
                                        </div>
                                    ))}
                                </div>

                                {/* Month grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty cells for days before start of month */}
                                    {Array.from({ length: getDay(startOfMonth(currentDate)) === 0 ? 6 : getDay(startOfMonth(currentDate)) - 1 }).map((_, idx) => (
                                        <div key={`empty-start-${idx}`} className="h-14"></div>
                                    ))}

                                    {/* Actual month days */}
                                    {getDaysToDisplay().map((day, dayIdx) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const dayAvailable = getAvailabilityStatus(day, 'day');
                                        const nightAvailable = getAvailabilityStatus(day, 'night');
                                        const isThisDateUpdating = isDateUpdating(day);

                                        // Calculate background based on availability
                                        let bgClass = "bg-white";
                                        if (dayAvailable && nightAvailable) {
                                            bgClass = "bg-gradient-to-b from-green-100 to-indigo-100";
                                        } else if (dayAvailable) {
                                            bgClass = "bg-green-50";
                                        } else if (nightAvailable) {
                                            bgClass = "bg-indigo-50";
                                        }

                                        return (
                                            <Popover key={dayIdx} modal={true}>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        className={`
                                                          h-14 p-1 rounded-md 
                                                          ${!isCurrentMonth ? "opacity-40" : ""}
                                                          ${isToday ? "ring-2 ring-blue-500 shadow-sm" : "border"}
                                                          flex flex-col
                                                          transition-all duration-200
                                                          ${!isCurrentMonth ? "bg-gray-50" : bgClass}
                                                          relative
                                                          ${isThisDateUpdating ? "cursor-wait" : ""}
                                                          ${!editable ? "cursor-default" : ""}
                                                        `}
                                                        disabled={!isCurrentMonth || isThisDateUpdating || !editable}
                                                    >
                                                        <div className={`
                                                          text-xs font-medium text-center
                                                          ${isToday ? "text-blue-600 font-bold" : ""}
                                                        `}>
                                                            {format(day, 'd')}
                                                        </div>

                                                        {/* Indicators at bottom of cell */}
                                                        <div className="flex justify-center gap-1 mt-auto">
                                                            {dayAvailable && (
                                                                <div className="h-2 w-2 rounded-full bg-green-500"
                                                                    aria-label="Available for day shift"></div>
                                                            )}
                                                            {nightAvailable && (
                                                                <div className="h-2 w-2 rounded-full bg-indigo-500"
                                                                    aria-label="Available for night shift"></div>
                                                            )}
                                                            {isThisDateUpdating && (
                                                                <Loader2 className="h-2 w-2 animate-spin text-blue-500 absolute inset-0 m-auto" />
                                                            )}
                                                        </div>
                                                    </button>
                                                </PopoverTrigger>

                                                {isCurrentMonth && editable && (
                                                    <PopoverContent className="w-56 p-3 shadow-lg rounded-lg border border-gray-200" side="top">
                                                        <div className="text-center font-medium mb-3 pb-2 border-b border-gray-100">
                                                            {format(day, 'EEEE, MMMM d')}
                                                        </div>
                                                        <div className="flex flex-col gap-3">
                                                            {/* Day shift checkbox */}
                                                            <label className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-50">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 mr-2 accent-green-500"
                                                                    checked={getAvailabilityStatus(day, 'day')}
                                                                    onChange={() => toggleAvailability(day, 'day')}
                                                                    disabled={isThisDateUpdating || !editable}
                                                                />
                                                                <span className="flex items-center">
                                                                    {isThisDateUpdating ? (
                                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-500" />
                                                                    ) : (
                                                                        <Sun className="h-4 w-4 mr-2 text-green-500" />
                                                                    )}
                                                                    Available for Day
                                                                </span>
                                                            </label>

                                                            {/* Night shift checkbox */}
                                                            <label className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-50">
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 mr-2 accent-indigo-500"
                                                                    checked={getAvailabilityStatus(day, 'night')}
                                                                    onChange={() => toggleAvailability(day, 'night')}
                                                                    disabled={isThisDateUpdating || !editable}
                                                                />
                                                                <span className="flex items-center">
                                                                    {isThisDateUpdating ? (
                                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-500" />
                                                                    ) : (
                                                                        <Moon className="h-4 w-4 mr-2 text-indigo-500" />
                                                                    )}
                                                                    Available for Night
                                                                </span>
                                                            </label>

                                                            {/* Clear button - only shown if at least one is checked */}
                                                            {(getAvailabilityStatus(day, 'day') || getAvailabilityStatus(day, 'night')) && (
                                                                <button
                                                                    className="w-full mt-2 text-sm text-gray-500 hover:text-red-500 py-1 transition-colors flex items-center justify-center"
                                                                    onClick={() => clearAvailability(day)}
                                                                    disabled={isThisDateUpdating || !editable}
                                                                >
                                                                    {isThisDateUpdating ? (
                                                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    )}
                                                                    Clear Availability
                                                                </button>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                )}
                                            </Popover>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP/TABLET CALENDAR VIEW */}
                    <div className="hidden md:block">
                        {/* Desktop/Tablet Calendar Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {weekdays.map((day, i) => (
                                <div key={i} className="text-center font-medium text-gray-500 p-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Find today in days to display */}
                        {(() => {
                            const allDays = getDaysToDisplay();
                            const todayIndex = allDays.findIndex(day => isSameDay(day, new Date()));
                            // Mark today with a special CSS class or property if found
                            const hasTodayInView = todayIndex !== -1;

                            return (
                                /* Desktop/Tablet Calendar Grid */
                                <div className="grid grid-cols-7 gap-2">
                                    {viewMode === "month" &&
                                        // Add empty cells for the days before the first day of the month
                                        Array.from({ length: getDay(startOfMonth(currentDate)) === 0 ? 6 : getDay(startOfMonth(currentDate)) - 1 }).map((_, i) =>
                                            <div key={`empty-${i}`} className="p-1"></div>
                                        )
                                    }

                                    {allDays.map((day, dayIndex) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const isThisDateUpdating = isDateUpdating(day);

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={`
                                                  p-3 rounded-lg 
                                                  ${!isCurrentMonth ? "opacity-40" : ""}
                                                  ${isToday ? "ring-2 ring-blue-500" : "border border-gray-200"}
                                                  flex flex-col
                                                  h-32
                                                  transition-all duration-200
                                                  ${!isCurrentMonth ? "bg-gray-50" : "bg-white"}
                                                  hover:shadow-md
                                                  ${isToday ? "shadow-md" : ""}
                                                  ${isThisDateUpdating ? "opacity-70" : ""}
                                                `}
                                            >
                                                <div className={`
                                                  text-right font-semibold text-sm mb-2
                                                  ${isToday ? "text-blue-600" : "text-gray-700"}
                                                `}>
                                                    {format(day, 'd')}
                                                </div>

                                                <div className="flex flex-col gap-2 mt-1">
                                                    {/* Day toggle button with enhanced styling */}
                                                    <button
                                                        className={`
                                                          flex items-center justify-between py-1.5 px-2 rounded-md text-sm
                                                          transition-all duration-200 w-full
                                                          ${getAvailabilityStatus(day, 'day')
                                                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm"
                                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}
                                                          ${isThisDateUpdating ? "opacity-70 cursor-wait" : ""}
                                                          ${!editable ? "opacity-70 cursor-not-allowed" : ""}
                                                        `}
                                                        onClick={() => toggleAvailability(day, 'day')}
                                                        disabled={isThisDateUpdating || !editable}
                                                        aria-label={`${getAvailabilityStatus(day, 'day') ? 'Remove' : 'Add'} day shift availability for ${format(day, 'PPP')}`}
                                                    >
                                                        <div className="flex items-center">
                                                            {isThisDateUpdating ? (
                                                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                            ) : (
                                                                <Sun className="h-3.5 w-3.5 mr-1" />
                                                            )}
                                                            <span className="text-xs">Day</span>
                                                        </div>
                                                        {getAvailabilityStatus(day, 'day') && (
                                                            <div className="w-3 h-3 rounded-full bg-white/25 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>
                                                        )}
                                                    </button>

                                                    {/* Night toggle button with enhanced styling */}
                                                    <button
                                                        className={`
                                                          flex items-center justify-between py-1.5 px-2 rounded-md text-sm
                                                          transition-all duration-200 w-full
                                                          ${getAvailabilityStatus(day, 'night')
                                                                ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm"
                                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}
                                                          ${isThisDateUpdating ? "opacity-70 cursor-wait" : ""}
                                                          ${!editable ? "opacity-70 cursor-not-allowed" : ""}
                                                        `}
                                                        onClick={() => toggleAvailability(day, 'night')}
                                                        disabled={isThisDateUpdating || !editable}
                                                        aria-label={`${getAvailabilityStatus(day, 'night') ? 'Remove' : 'Add'} night shift availability for ${format(day, 'PPP')}`}
                                                    >
                                                        <div className="flex items-center">
                                                            {isThisDateUpdating ? (
                                                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                            ) : (
                                                                <Moon className="h-3.5 w-3.5 mr-1" />
                                                            )}
                                                            <span className="text-xs">Night</span>
                                                        </div>
                                                        {getAvailabilityStatus(day, 'night') && (
                                                            <div className="w-3 h-3 rounded-full bg-white/25 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AvailabilityCalendar;