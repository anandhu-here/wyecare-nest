import React, { useState, useEffect } from 'react';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, getDay, addDays, subDays, parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Info, RotateCcw, Loader2 } from 'lucide-react';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedMonth, setSelectedYear, setSelectedDay } from '../calendarSlice';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// // Import components
// import AddShiftDialog from './calendar-views/add-shift';
// import ViewShiftDialog from './calendar-views/shift-detail';
// import EditShiftDialog from './calendar-views/edit-shift';
// import IntegratedShiftDialog from './calendar-views/integrated-shift-add';
// import ShiftTypeDialog from 'src/content/dashboards/home/views/AddShiftTypeDialog';
// import AgencyShiftRequestDialog from './calendar-views/unauth-shift-add';
// import { LoadingOverlay } from './loading-overlay';



// Import types
import { IShift } from '@wyecare-monorepo/shared-types';
import { LoadingOverlay } from '@/components/loading-overlay';
import { useMediaQuery } from '@/app/layouts/hook/media-query';
import { AppDispatch } from '@/redux/store';
import { useCreateMultipleShiftsMutation, useCreateShiftMutation, useGetAgencyShiftsQuery, useGetHomeShiftsQuery, useUpdateShiftMutation } from '../shiftApi';
import { selectCurrentOrganization } from '../../auth/AuthSlice';
import { toast } from 'react-toastify';
import IntegratedShiftDialog from './shift-publish-dialog';
import ViewShiftDialog from './view-dialog';

// Skeleton for loading state
const CalendarSkeleton: React.FC = () => {
    const {
        isMobile
    } = useMediaQuery()
    const renderWeekDays = () => {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div className="col-span-1" key={day}>
                <Skeleton className="h-6 w-4/5 mx-auto" />
            </div>
        ));
    };

    const renderDays = () => {
        const days = [];
        const totalDays = isMobile ? 7 : 35; // One week for mobile, full month for desktop

        for (let i = 0; i < totalDays; i++) {
            days.push(
                <div className="col-span-1" key={i}>
                    <div className="p-1 border border-border rounded-md flex flex-col gap-1"
                        style={{ height: isMobile ? '80px' : '120px' }}>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-5 w-4/5" />
                        {!isMobile && <Skeleton className="h-5 w-3/5" />}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-4 rounded-lg border border-border bg-background">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderWeekDays()}
                {renderDays()}
            </div>

            {isMobile && (
                <div className="flex justify-center items-center mt-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-6 ml-2 rounded-full" />
                </div>
            )}
        </div>
    );
};

interface ShiftCalendarProps {
    onMonthChange: (month: number, year: number) => void;
}

const ModernShiftCalendar: React.FC<ShiftCalendarProps> = ({
    onMonthChange
}) => {
    const [currentDate, setCurrentDate] = useState<moment.Moment>(moment());
    const [viewMode, setViewMode] = useState("month"); // "week" or "month"
    const [showHelp, setShowHelp] = useState(false);
    const [shifts, setShifts] = useState<Record<string, IShift[]>>({});
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewShiftOpen, setIsViewShiftOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
    const [selectedShifts, setSelectedShifts] = useState<IShift[]>([]);
    const [shiftToEdit, setShiftToEdit] = useState<IShift | null>(null);
    const [isAgencyRequestDialogOpen, setIsAgencyRequestDialogOpen] = useState(false);
    const [openShiftTypeDialog, setOpenShiftTypeDialog] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const dispatch = useDispatch<AppDispatch>();

    // Get user and organization data from Redux
    const currentOrganization = useSelector(selectCurrentOrganization);

    // Create mutation hooks
    const [createShift] = useCreateShiftMutation();
    const [updateShift] = useUpdateShiftMutation();
    const [createMultipleShifts] = useCreateMultipleShiftsMutation();

    // RTK Query hooks based on organization type
    const {
        data: homeShifts,
        isLoading: homeShiftsLoading,
        isError: homeShiftsError,
        refetch: refetchHomeShifts
    } = useGetHomeShiftsQuery({
        orgId: currentOrganization?._id as string,
        month: currentDate.month() + 1,
        year: currentDate.year()
    }, {
        skip: !currentOrganization || currentOrganization.type !== 'home'
    });

    const {
        data: agencyShifts,
        isLoading: agencyShiftsLoading,
        isError: agencyShiftsError,
        refetch: refetchAgencyShifts
    } = useGetAgencyShiftsQuery({
        agencyId: currentOrganization?._id as string,
        month: currentDate.month() + 1,
        year: currentDate.year()
    }, {
        skip: !currentOrganization || currentOrganization.type !== 'agency'
    });

    // Helper function to determine background style for a day based on shift status
    const getShiftDayStyle = (dateKey: string) => {
        const dayShifts = shifts[dateKey] || [];
        if (dayShifts.length === 0) return { className: "", style: {} };

        // Count shifts by status
        const shiftStatus = dayShifts.reduce((acc, shift) => ({
            completed: acc.completed + (shift.isCompleted || shift.status === 'completed' || shift.status === 'approved' ? 1 : 0),
            pending: acc.pending + (shift.status === 'pending' ? 1 : 0),
            total: acc.total + 1
        }), { completed: 0, pending: 0, total: 0 });

        // Determine color theme based on shift status
        if (shiftStatus.completed === shiftStatus.total) {
            // All shifts completed - use green theme
            return {
                className: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
                style: {}
            };
        } else if (shiftStatus.pending > 0) {
            // Has pending shifts - use amber theme
            return {
                className: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
                style: {}
            };
        } else {
            // Has upcoming shifts
            return {
                className: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
                style: {}
            };
        }
    };

    useEffect(() => {
        // Call onMonthChange when the component mounts
        onMonthChange(currentDate.month() + 1, currentDate.year());
    }, []);

    useEffect(() => {
        if (currentOrganization?.type === 'home' && homeShifts) {
            const groupedShifts = groupShiftsByDate(homeShifts);
            setShifts(groupedShifts);
        } else if (
            currentOrganization?.type === 'agency' &&
            agencyShifts
        ) {
            const groupedShifts = groupShiftsByDate(agencyShifts);
            setShifts(groupedShifts);
        }
    }, [currentOrganization, homeShifts, agencyShifts]);

    const groupShiftsByDate = (shiftsData: IShift[]): Record<string, IShift[]> => {
        return shiftsData.reduce((acc, shift) => {
            const dateKey = shift.date;
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(shift);
            return acc;
        }, {} as Record<string, IShift[]>);
    };

    const handleAddShift = (newShifts: IShift[]) => {
        setShifts((prevShifts) => {
            const updatedShifts = { ...prevShifts };
            newShifts.forEach((shift) => {
                const dateKey = moment(shift.date).format('YYYY-MM-DD');
                if (!updatedShifts[dateKey]) {
                    updatedShifts[dateKey] = [];
                }
                updatedShifts[dateKey].push(shift);
            });
            return updatedShifts;
        });
        setIsShiftDialogOpen(false);
    };

    // For date-fns compatibility
    const getDateFromMoment = (momentDate: moment.Moment) => {
        return new Date(momentDate.year(), momentDate.month(), momentDate.date());
    };

    // Updated navigation functions
    const navigateNext = () => {
        if (viewMode === "week") {
            setCurrentDate(moment(currentDate).add(1, 'week'));
        } else {
            const newDate = moment(currentDate).add(1, 'month');
            setCurrentDate(newDate);
            onMonthChange(newDate.month() + 1, newDate.year());
            dispatch(setSelectedMonth(newDate.month() + 1));
            dispatch(setSelectedYear(newDate.year()));
        }
    };

    const navigatePrev = () => {
        if (viewMode === "week") {
            setCurrentDate(moment(currentDate).subtract(1, 'week'));
        } else {
            const newDate = moment(currentDate).subtract(1, 'month');
            setCurrentDate(newDate);
            onMonthChange(newDate.month() + 1, newDate.year());
            dispatch(setSelectedMonth(newDate.month() + 1));
            dispatch(setSelectedYear(newDate.year()));
        }
    };

    // Get dates to display based on view mode
    const getDaysToDisplay = () => {
        const currentDateAsDate = getDateFromMoment(currentDate);

        if (viewMode === "week") {
            const start = startOfWeek(currentDateAsDate, { weekStartsOn: 0 }); // Start from Sunday
            const end = endOfWeek(currentDateAsDate, { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfMonth(currentDateAsDate);
            const end = endOfMonth(currentDateAsDate);

            // Get the start of the first week of the month
            const monthStartDay = getDay(start);
            const startOfCalendar = subDays(start, monthStartDay);

            // Get the end of the last week of the month
            const monthEndDay = getDay(end);
            const endOfCalendar = addDays(end, 6 - monthEndDay);

            return eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });
        }
    };

    const handleDayClick = (day: Date) => {
        // Convert date-fns date to moment for compatibility with existing logic
        const momentDay = moment(day);
        const dateKey = momentDay.format('YYYY-MM-DD');
        const dayShifts = shifts[dateKey] || [];

        setSelectedDate(momentDay);
        setSelectedShifts(dayShifts);
        dispatch(setSelectedDay(momentDay.date()));

        if (dayShifts.length > 0) {
            // If there are shifts, show them
            setIsViewShiftOpen(true);
        } else if (currentOrganization?.type === 'home') {
            // Home users can add shifts directly
            setIsShiftDialogOpen(true);
        } else if (currentOrganization?.type === 'agency') {
            // Agency users see the request dialog
            setIsAgencyRequestDialogOpen(true);
        }
    };

    const handleEditShift = (shift: IShift) => {
        setShiftToEdit(shift);
        setIsEditMode(true);
        if (currentOrganization?.type === 'home') {
            setIsShiftDialogOpen(true);
        } else if (currentOrganization?.type === 'agency') {
            setIsAgencyRequestDialogOpen(true);
        }
    };

    const handleUpdateShift = (updatedShift: IShift) => {
        console.log('Updated shift:', updatedShift);
        setShifts((prevShifts) => {
            const updatedShifts = { ...prevShifts };
            const dateKey = updatedShift.date;
            updatedShifts[dateKey] = updatedShifts[dateKey].map((shift) =>
                shift._id === updatedShift._id ? updatedShift : shift
            );
            return updatedShifts;
        });

        setIsShiftDialogOpen(false);
        setIsViewShiftOpen(false);
        setShiftToEdit(null);
        setIsEditMode(false);
        setSelectedShifts([]);
    };

    // Create quick select for this week, next week, next month
    const quickSelect = (option: string) => {
        let newDate;
        switch (option) {
            case "thisWeek":
                newDate = moment();
                setViewMode("week");
                break;
            case "nextWeek":
                newDate = moment().add(1, 'week');
                setViewMode("week");
                break;
            case "nextMonth":
                newDate = moment().add(1, 'month');
                setViewMode("month");
                break;
            case "today":
                newDate = moment();
                break;
            default:
                newDate = moment();
        }
        setCurrentDate(newDate);
        onMonthChange(newDate.month() + 1, newDate.year());
        dispatch(setSelectedMonth(newDate.month() + 1));
        dispatch(setSelectedYear(newDate.year()));
    };

    // Get week or month label for header
    const getHeaderLabel = () => {
        const currentDateAsDate = getDateFromMoment(currentDate);

        if (viewMode === "week") {
            const start = startOfWeek(currentDateAsDate, { weekStartsOn: 0 });
            const end = endOfWeek(currentDateAsDate, { weekStartsOn: 0 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return format(currentDateAsDate, 'MMMM yyyy');
        }
    };

    // Days of week for header labels
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Check if a date has shifts
    const hasShifts = (date: Date): boolean => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        return (shifts[dateKey]?.length || 0) > 0;
    };

    // Get shift count for a date
    const getShiftCount = (date: Date): number | null => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        if (shifts[dateKey]) {
            return shifts[dateKey].reduce((acc, shift) => acc + (shift.count || 0), 0);
        }
        return null;
    };

    // Calculate shift statuses for a day
    const getShiftStatuses = (date: Date) => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        const dayShifts = shifts[dateKey] || [];

        return dayShifts.reduce((acc, shift) => ({
            completed: acc.completed + (shift.isCompleted || shift.status === 'completed' || shift.status === 'approved' ? 1 : 0),
            pending: acc.pending + (shift.status === 'pending' ? 1 : 0),
            total: acc.total + 1
        }), { completed: 0, pending: 0, total: 0 });
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            if (currentOrganization?.type === 'home') {
                await refetchHomeShifts();
            } else if (currentOrganization?.type === 'agency') {
                await refetchAgencyShifts();
            }

            setTimeout(() => {
                setRefreshing(false);
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error('Error refreshing shifts. Please try again later.');
        }
    };

    const handleSaveShiftType = async (shiftType: any) => {
        try {
            // This will be implemented in a future step
            console.log('Save shift type:', shiftType);

            toast.success('Shift type saved successfully!');

            setOpenShiftTypeDialog(false);
            setIsShiftDialogOpen(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.data?.message || 'Error saving shift type');
        }
    };

    // Determine if we're loading or have an error
    const isLoading = (currentOrganization?.type === 'home' && homeShiftsLoading) ||
        (currentOrganization?.type === 'agency' && agencyShiftsLoading);

    const hasError = (currentOrganization?.type === 'home' && homeShiftsError) ||
        (currentOrganization?.type === 'agency' && agencyShiftsError);

    if (isLoading) {
        return <CalendarSkeleton />;
    }

    if (hasError) {
        return (
            <Card className="p-6">
                <div className="text-center text-red-500">
                    <p>Error loading shifts. Please try again later.</p>
                    <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="w-full px-0">
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
                            View and manage shifts in the calendar. Click on a day to view or add shifts.
                        </p>

                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-200 rounded mr-2 border border-green-300"></div>
                                <span>Completed shifts</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-amber-100 to-amber-200 rounded mr-2 border border-amber-300"></div>
                                <span>Pending shifts</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 rounded mr-2 border border-blue-300"></div>
                                <span>Upcoming shifts</span>
                            </div>
                            <div className="flex items-center">
                                <Badge className="bg-indigo-500">Today</Badge>
                                <span className="ml-2">Current day is highlighted</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white items-start justify-between flex-row">
                    <div>
                        <CardTitle className="flex justify-between items-center">
                            Shift Calendar
                        </CardTitle>
                        <p className="text-xs font-medium mt-1">
                            View and manage your shifts
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">{getHeaderLabel()}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>


                {/* View mode tabs */}
                <div className="px-4 pt-4">
                    <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v); }} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="week">Week</TabsTrigger>
                            <TabsTrigger value="month">Month</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Quick jump buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => quickSelect("today")}>
                        Today
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickSelect("thisWeek")}>
                        This Week
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickSelect("nextWeek")}>
                        Next Week
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => quickSelect("nextMonth")}>
                        Next Month
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        onClick={handleRefresh}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Refresh
                    </Button>

                    {!showHelp && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowHelp(true)}
                        >
                            <Info className="h-4 w-4" />
                            Help
                        </Button>
                    )}
                </div>

                <CardContent className="p-2">
                    {/* MOBILE CALENDAR VIEW */}
                    <div className="block md:hidden">
                        {/* Mobile Week View */}
                        {viewMode === "week" && (
                            <div className="flex flex-col">
                                {/* Week day header */}
                                <div className="grid grid-cols-7 mb-1">
                                    {weekdays.map((day, idx) => (
                                        <div key={idx} className="text-center text-xs font-medium text-gray-500">
                                            {day.substring(0, 1)}
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile week view - show all 7 days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {getDaysToDisplay().map((day, dayIdx) => {
                                        const isToday = isSameDay(day, new Date());
                                        const dateKey = moment(day).format('YYYY-MM-DD');
                                        const hasShiftsForDay = hasShifts(day);
                                        const shiftCount = getShiftCount(day);
                                        const dayShifts = shifts[dateKey] || [];
                                        const dayStyle = hasShiftsForDay ? getShiftDayStyle(dateKey) : { className: "", style: {} };

                                        // Calculate shift statuses
                                        const shiftStatus = dayShifts.reduce((acc, shift) => ({
                                            completed: acc.completed + (shift.isCompleted ? 1 : 0),
                                            approved: acc.approved + (shift.bookingStatus === 'approved' ? 1 : 0),
                                            pending: acc.pending + (shift.bookingStatus === 'pending' ? 1 : 0),
                                            done: acc.done + (shift.isDone ? 1 : 0),
                                            total: acc.total + 1
                                        }), { completed: 0, approved: 0, pending: 0, done: 0, total: 0 });

                                        // Determine badge color based on shift statuses
                                        let badgeColor = "bg-blue-500"; // Default color

                                        if (shiftStatus.done > 0) {
                                            badgeColor = "bg-green-500"; // Green for done shifts
                                        } else if (shiftStatus.completed > 0) {
                                            badgeColor = "bg-teal-500"; // Teal for completed but not done
                                        } else if (shiftStatus.approved > 0) {
                                            badgeColor = "bg-blue-500"; // Blue for approved
                                        } else if (shiftStatus.pending > 0) {
                                            badgeColor = "bg-amber-500"; // Amber for pending
                                        }

                                        // Create title based on status for tooltip
                                        let statusTitle = "";
                                        if (shiftStatus.done > 0) {
                                            statusTitle = `${shiftStatus.done} completed and done shifts`;
                                        } else if (shiftStatus.completed > 0) {
                                            statusTitle = `${shiftStatus.completed} completed shifts`;
                                        } else if (shiftStatus.approved > 0) {
                                            statusTitle = `${shiftStatus.approved} approved shifts`;
                                        } else if (shiftStatus.pending > 0) {
                                            statusTitle = `${shiftStatus.pending} pending shifts`;
                                        } else {
                                            statusTitle = `${shiftStatus.total} shifts`;
                                        }

                                        return (
                                            <div key={dayIdx} className="relative">
                                                <div
                                                    className={`
                            p-1 rounded-lg cursor-pointer
                            ${isToday ? "border-2 border-primary" : "border border-gray-200"}
                            ${dayStyle.className}
                            flex flex-col h-12
                            shadow-md
                            transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                          `}
                                                    style={dayStyle.style}
                                                    onClick={() => handleDayClick(day)}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className={`text-sm font-bold ${isToday ? "text-primary" : "text-gray-700"}`}>
                                                            {format(day, 'd')}
                                                        </div>
                                                    </div>

                                                    {hasShiftsForDay && (
                                                        <div className="mt-auto flex justify-center">
                                                            <Badge
                                                                className={`text-[9px] h-4 min-w-4 flex items-center justify-center px-1 ${badgeColor}`}
                                                                title={statusTitle}
                                                            >
                                                                {shiftCount}
                                                            </Badge>
                                                        </div>
                                                    )}
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
                                    {getDaysToDisplay().map((day, dayIdx) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, getDateFromMoment(currentDate));
                                        const dateKey = moment(day).format('YYYY-MM-DD');
                                        const hasShiftsForDay = hasShifts(day);
                                        const shiftCount = getShiftCount(day);
                                        const dayShifts = shifts[dateKey] || [];
                                        const dayStyle = hasShiftsForDay ? getShiftDayStyle(dateKey) : {
                                            className: isCurrentMonth ? "bg-white" : "bg-gray-50",
                                            style: {}
                                        };

                                        // Calculate shift statuses with corrected properties
                                        const shiftStatus = dayShifts.reduce((acc, shift) => ({
                                            completed: acc.completed + (shift.isCompleted ? 1 : 0),
                                            approved: acc.approved + (shift.bookingStatus === 'approved' ? 1 : 0),
                                            pending: acc.pending + (shift.bookingStatus === 'pending' ? 1 : 0),
                                            done: acc.done + (shift.isDone ? 1 : 0),
                                            total: acc.total + 1
                                        }), { completed: 0, approved: 0, pending: 0, done: 0, total: 0 });

                                        // Determine badge color based on shift statuses
                                        let badgeColor = "bg-blue-500"; // Default color

                                        if (shiftStatus.done > 0) {
                                            badgeColor = "bg-green-500"; // Green for done shifts
                                        } else if (shiftStatus.completed > 0) {
                                            badgeColor = "bg-teal-500"; // Teal for completed but not done
                                        } else if (shiftStatus.approved > 0) {
                                            badgeColor = "bg-blue-500"; // Blue for approved
                                        } else if (shiftStatus.pending > 0) {
                                            badgeColor = "bg-amber-500"; // Amber for pending
                                        }

                                        // Create title based on status for tooltip
                                        let statusTitle = "";
                                        if (shiftStatus.done > 0) {
                                            statusTitle = `${shiftStatus.done} completed and done shifts`;
                                        } else if (shiftStatus.completed > 0) {
                                            statusTitle = `${shiftStatus.completed} completed shifts`;
                                        } else if (shiftStatus.approved > 0) {
                                            statusTitle = `${shiftStatus.approved} approved shifts`;
                                        } else if (shiftStatus.pending > 0) {
                                            statusTitle = `${shiftStatus.pending} pending shifts`;
                                        } else {
                                            statusTitle = `${shiftStatus.total} shifts`;
                                        }

                                        return (
                                            <div
                                                key={dayIdx}
                                                className={`
                          h-11 p-1 rounded-lg cursor-pointer shadow-md flex flex-col relative
                          ${!isCurrentMonth ? "opacity-20" : ""}
                          ${isToday ? "ring-2 ring-primary" : "border"}
                          ${dayStyle.className}
                          transition-all duration-200
                        `}
                                                style={dayStyle.style}
                                                onClick={() => handleDayClick(day)}
                                            >
                                                <div className={`
                          text-xs font-medium text-center
                          ${isToday ? "text-primary font-bold" : ""}
                        `}>
                                                    {format(day, 'd')}
                                                </div>

                                                {hasShiftsForDay && (
                                                    <div className="mt-auto flex justify-center">
                                                        <Badge
                                                            className={`text-[9px] h-4 min-w-4 flex items-center justify-center px-1 ${badgeColor}`}
                                                            title={statusTitle}
                                                        >
                                                            {shiftCount}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
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

                        {/* Desktop/Tablet Calendar Grid */}
                        <div className="grid grid-cols-7 gap-3">
                            {getDaysToDisplay().map((day, dayIndex) => {
                                const isToday = isSameDay(day, new Date());
                                const isCurrentMonth = isSameMonth(day, getDateFromMoment(currentDate));
                                const hasShiftsForDay = hasShifts(day);
                                const shiftCount = getShiftCount(day);
                                const dateKey = moment(day).format('YYYY-MM-DD');
                                const dayShifts = shifts[dateKey] || [];

                                // Calculate shift statuses with corrected properties
                                const shiftStatus = dayShifts.reduce((acc, shift) => ({
                                    completed: acc.completed + (shift.isCompleted ? 1 : 0),
                                    approved: acc.approved + (shift.bookingStatus === 'approved' ? 1 : 0),
                                    pending: acc.pending + (shift.bookingStatus === 'pending' ? 1 : 0),
                                    done: acc.done + (shift.isDone ? 1 : 0),
                                    total: acc.total + 1
                                }), { completed: 0, approved: 0, pending: 0, done: 0, total: 0 });

                                return (
                                    <div
                                        key={dayIndex}
                                        className="col-span-1"
                                    >
                                        <div
                                            className={`
                        h-[80px] w-full relative cursor-pointer rounded-xl
                        overflow-hidden backdrop-blur-sm shadow-md
                        transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
                        ${!isCurrentMonth
                                                    ? "bg-gray-100/70 shadow-none dark:bg-gray-900/70 border-dashed border-gray-200 dark:border-gray-700"
                                                    : hasShiftsForDay
                                                        ? "bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/10 border border-border/40 hover:border-primary/20"
                                                        : "bg-white/80 dark:bg-gray-800/80 border border-border/40 hover:border-primary/20"}
                        ${isToday ? "ring-2 ring-primary/70 shadow-md" : ""}
                      `}
                                            onClick={() => handleDayClick(day)}
                                        >
                                            {/* Day number badge */}
                                            <div className={`
                        absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs
                        ${isToday
                                                    ? "bg-primary text-white font-medium"
                                                    : !isCurrentMonth
                                                        ? "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}
                      `}>
                                                {format(day, 'd')}
                                            </div>

                                            {/* Month indicator always shown for outside month days */}
                                            {(!isCurrentMonth || day.getDate() === 1 || day.getDate() === new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate()) && (
                                                <div className={`
                          absolute top-2 right-2 text-[10px] font-medium
                          ${!isCurrentMonth
                                                        ? "text-gray-400 dark:text-gray-500"
                                                        : "text-gray-500 dark:text-gray-400"}
                        `}>
                                                    {format(day, 'MMM')}
                                                </div>
                                            )}

                                            {hasShiftsForDay ? (
                                                <>
                                                    {/* Central count indicator */}
                                                    <div className="absolute bottom-0 inset-x-0 py-2 flex flex-col items-center">
                                                        <span className={`
                              text-lg font-bold
                              ${!isCurrentMonth
                                                                ? "text-gray-400 dark:text-gray-500"
                                                                : "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"}
                            `}>
                                                            {shiftCount}
                                                        </span>

                                                        {/* Status dots */}
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            {/* Done shifts - green dot */}
                                                            {shiftStatus.done > 0 && (
                                                                <div className={`w-2 h-2 rounded-full ${!isCurrentMonth ? "bg-green-300 dark:bg-green-800" : "bg-green-500"}`}
                                                                    title={`${shiftStatus.done} completed shifts`}></div>
                                                            )}

                                                            {/* Completed but not done shifts - blue-green dot */}
                                                            {shiftStatus.completed > 0 && !shiftStatus.done && (
                                                                <div className={`w-2 h-2 rounded-full ${!isCurrentMonth ? "bg-teal-300 dark:bg-teal-800" : "bg-teal-500"}`}
                                                                    title={`${shiftStatus.completed} completed shifts`}></div>
                                                            )}

                                                            {/* Approved shifts - blue dot */}
                                                            {shiftStatus.approved > 0 && (
                                                                <div className={`w-2 h-2 rounded-full ${!isCurrentMonth ? "bg-blue-300 dark:bg-blue-800" : "bg-blue-500"}`}
                                                                    title={`${shiftStatus.approved} approved shifts`}></div>
                                                            )}

                                                            {/* Pending shifts - amber/yellow dot */}
                                                            {shiftStatus.pending > 0 && (
                                                                <div className={`w-2 h-2 rounded-full ${!isCurrentMonth ? "bg-amber-300 dark:bg-amber-800" : "bg-amber-500"}`}
                                                                    title={`${shiftStatus.pending} pending shifts`}></div>
                                                            )}

                                                            {/* Other shifts - gray dot */}
                                                            {(shiftStatus.total - shiftStatus.completed - shiftStatus.approved - shiftStatus.pending - shiftStatus.done) > 0 && (
                                                                <div className={`w-2 h-2 rounded-full ${!isCurrentMonth ? "bg-gray-300 dark:bg-gray-600" : "bg-gray-500"}`}
                                                                    title="Other shifts"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`text-xs italic ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"}`}>
                                                        {!isCurrentMonth ? "" : "No shifts"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                </CardContent>
            </Card>

            <LoadingOverlay isVisible={refreshing} />

            {/* Dialogs */}
            <IntegratedShiftDialog
                open={isShiftDialogOpen}
                onClose={() => setIsShiftDialogOpen(false)}
                selectedDate={selectedDate}
                onAddShift={handleAddShift}
                onEditShift={handleUpdateShift}
                shiftToEdit={isEditMode ? shiftToEdit : null}
                onClickCreateShiftType={() => {
                    setOpenShiftTypeDialog(true);
                    setIsShiftDialogOpen(false);
                }}
                isEditMode={isEditMode}
            />
            <ViewShiftDialog
                open={isViewShiftOpen}
                onClose={() => setIsViewShiftOpen(false)}
                selectedDate={selectedDate}
                shifts={selectedShifts}
                onShiftsUpdate={(updatedShifts) => {
                    if (selectedDate) {
                        setShifts((prevShifts) => ({
                            ...prevShifts,
                            [selectedDate.format('YYYY-MM-DD')]: updatedShifts
                        }));
                        setSelectedShifts(updatedShifts);
                    }
                }}
                onEditClick={handleEditShift}
                onAddFurther={() => {
                    setIsEditMode(false);
                    if (currentOrganization?.type === 'home') {
                        setIsShiftDialogOpen(true);
                    }
                    else {
                        setIsAgencyRequestDialogOpen(true);
                    }
                    setIsViewShiftOpen(false);
                }}
            />

            {/* <ShiftTypeDialog
                open={openShiftTypeDialog}
                onClose={() => {
                    setOpenShiftTypeDialog(false);
                    // Re-open the shift dialog after closing ShiftTypeDialog
                    setIsShiftDialogOpen(true);
                }}
                onSave={handleSaveShiftType}
                selectedShiftType={null}
            />

           

            <AgencyShiftRequestDialog
                open={isAgencyRequestDialogOpen}
                onClose={() => setIsAgencyRequestDialogOpen(false)}
                selectedDate={selectedDate}
                onAddShift={handleAddShift}
                isEditMode={isEditMode}
                onEditShift={handleUpdateShift}
                shiftToEdit={isEditMode ? shiftToEdit : null}
            />  */}
        </div>
    );
};

export default ModernShiftCalendar;