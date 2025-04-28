import React, { useState, useEffect, useRef } from 'react';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, getDay,
    addDays, parseISO, subDays
} from 'date-fns';
import { ChevronLeft, ChevronRight, RotateCw, Sun, Moon, Info, Loader2, Calendar as CalendarIcon, Check, MapPin, Circle } from 'lucide-react';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';

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
import { IShiftAssignment } from '@wyecare-monorepo/shared-types';
import { toast } from 'react-toastify';
import ShiftViewDialog from './shift-components/view-assigned-shifts';
import { selectUser } from '../auth/AuthSlice';
import { shiftsApi, useGetUserAssignmentsQuery } from '../shift/shiftApi';
import { setSelectedDay } from '../shift/calendarSlice';
// import { ShiftAssignment } from 'src/components/core/ui/types/care-shift.types';
// import QRCodeDialog from 'src/components/core/ui/calendar-views/scan-qr';
// import AttendanceQRDialog from 'src/components/core/ui/calendar-views/attendance-qr';
// import ShiftViewDialog from 'src/components/core/ui/calendar-views/view-assigned-shifts';

interface StaffShiftCalendarProps {
    onMonthChange: (month: number, year: number) => void;
}

const StaffShiftCalendar: React.FC<StaffShiftCalendarProps> = ({
    onMonthChange
}) => {
    const [currentDate, setCurrentDate] = useState(moment());
    const [viewMode, setViewMode] = useState("week"); // "week" or "month"
    const [showHelp, setShowHelp] = useState(false);
    const [assignments, setAssignments] = useState<Record<string, IShiftAssignment[]>>({});
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
    const [isViewShiftOpen, setIsViewShiftOpen] = useState(false);
    const [selectedShifts, setSelectedShifts] = useState<IShiftAssignment[]>([]);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<IShiftAssignment | null>(null);
    const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [attendanceQrDialogOpen, setAttendanceQrDialogOpen] = useState(false);
    const [currentAttendanceQrCode, setCurrentAttendanceQrCode] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // For touch events and swiping
    const touchStartX = useRef<number | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);

    // const [createTimesheetAndGenerateQRCode] = useCreateTimesheetAndGenerateQRCodeMutation();
    // const [validateQRCode] = useValidateQRCodeMutation();

    // const { data: qrCodeStatus, refetch: refetchQrCodeStatus } = useCheckTimesheetQrcodeStatusQuery(currentQrCode ?? '', { skip: !currentQrCode });

    const dispatch = useDispatch();
    const userState = useSelector(selectUser);

    const {
        data: userAssignments,
        isLoading,
        isError,
        refetch
    } = useGetUserAssignmentsQuery(
        {
            userId: userState?._id as string,
        }
    );

    // Helper function to determine background color and styling for a day based on shift status
    // Helper function to determine if a shift is a night shift based on its timing
    const isNightShift = (shift) => {
        // Try to get the timing information
        if (!shift.shift?.shiftPattern?.timings) return false;

        // Find the applicable timing for this shift
        const timing = shift.shift.shiftPattern.timings.find(
            t => t.careHomeId === shift.shift.homeId._id
        );

        if (!timing) return false;

        // Parse start and end times to determine if it's a night shift
        // Night shift is typically when the shift includes hours between 20:00 and 08:00
        const startTime = timing.startTime;
        const endTime = timing.endTime;

        // Extract hours as numbers for comparison
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        // Check if the shift spans overnight hours
        // Night shifts typically start in the evening and end in the morning
        // Or span the overnight hours (e.g., 20:00-08:00, 22:00-06:00)
        return (startHour >= 20 || startHour <= 4) || (endHour <= 8 && endHour > 0);
    };

    // Helper function to determine background color based on shift statuses
    const getShiftDayStyle = (dateKey) => {
        const dayShifts = assignments[dateKey] || [];
        if (dayShifts.length === 0) return { className: "", style: {} };

        // Count shifts by status
        const shiftStatus = dayShifts.reduce((acc, shift) => ({
            completed: acc.completed + (shift.timesheet?.status === 'approved' ? 1 : 0),
            pending: acc.pending + (shift.timesheet?.status === 'pending' ? 1 : 0),
            total: acc.total + 1
        }), { completed: 0, pending: 0, total: 0 });

        // Check if any shifts are night shifts based on timing
        const hasNightShift = dayShifts.some(shift => isNightShift(shift));
        const hasDayShift = dayShifts.some(shift => !isNightShift(shift));

        // Determine color theme based on shift status
        if (shiftStatus.completed === shiftStatus.total) {
            // All shifts completed - use green theme
            return {
                className: "bg-gradient-to-br from-green-200 to-green-100 border-green-500",
                style: {},
                shiftStatus
            };
        } else if (shiftStatus.pending > 0) {
            // Has pending shifts - use amber theme
            return {
                className: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
                style: {},
                shiftStatus
            };
        } else {
            // Mixed shift types or just unsigned shifts
            return {
                className: "bg-white border-gray-200",
                style: {},
                shiftStatus
            };
        }
    };

    // Helper function to get the badge class for a shift
    const getShiftBadgeClass = (dayShifts) => {
        if (!dayShifts || dayShifts.length === 0) return "day-available";

        // Check if any shifts are night shifts
        const hasNightShift = dayShifts.some(shift => isNightShift(shift));

        return hasNightShift ? "night-available" : "day-available";
    };

    // Handle refresh function
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    // Initialize with today's date
    useEffect(() => {
        const today = moment();
        setCurrentDate(today);

        // Initial month change notification
        onMonthChange(today.month() + 1, today.year());
    }, []);

    useEffect(() => {
        let sse: EventSource;

        if (qrDialogOpen) {
            const baseUrl = import.meta.env.VITE_APP_API_HOSTNAME;
            sse = new EventSource(
                `${baseUrl}/api/v1/timesheet/timesheet-events?qrCode=${currentQrCode}`
            );

            sse.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received SSE message:', data);
                if (data.status === 'success') {
                    setQrDialogOpen(false);
                    setSelectedShifts((prev) => {
                        return prev.map((s) =>
                            s.shift?._id === selectedAssignment?.shift?._id
                                ? { ...s, timesheet: { status: 'approved' } }
                                : s
                        );
                    });

                    dispatch(shiftsApi.util.invalidateTags(['Shifts', 'AssignedStaffs', 'Timesheets']));
                    refetch();
                    toast.success('Successfully generated QR code!');
                }
            }

            sse.onerror = (event) => {
                console.log('Received SSE error:', event);
            }
            sse.onopen = (event) => {
                console.log('SSE connection opened:', event);
            }
        }
        else {
            if (sse) {
                sse.close();
            }
        }

        return () => {
            if (sse) {
                sse.close();
            }
        }
    }, [qrDialogOpen, currentQrCode]);

    useEffect(() => {
        let sse: EventSource;

        if (attendanceQrDialogOpen) {
            const baseUrl = import.meta.env.VITE_APP_API_HOSTNAME;
            sse = new EventSource(
                `${baseUrl}/api/v1/attendance/attendance-events?qrCode=${currentAttendanceQrCode}`
            );

            sse.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received attendance SSE message:', data);
                if (data.status === 'success') {
                    setAttendanceQrDialogOpen(false);
                    setSelectedShifts((prev) => {
                        return prev.map((s) =>
                            s.shift?._id === selectedAssignment?.shift?._id
                                ? { ...s, attendance: { status: data.attendanceStatus } }
                                : s
                        );
                    });
                    refetch();
                    toast.success('Successfully processed attendance!');
                } else if (data.status === 'error') {
                    toast.error(data.message || 'Error processing attendance QR code.');
                }
            };

            sse.onerror = (event) => {
                console.log('Received SSE error:', event);
            };

            sse.onopen = (event) => {
                console.log('SSE connection opened:', event);
            };
        } else {
            if (sse) {
                sse.close();
            }
        }

        return () => {
            if (sse) {
                sse.close();
            }
        }
    }, [attendanceQrDialogOpen, currentAttendanceQrCode]);

    const handleTimesheetRequest = async (shift: IShiftAssignment) => {
        try {
            setIsProcessing(true);
            // const response = await createTimesheetAndGenerateQRCode({
            //     shiftId: shift.shift?._id,
            //     shiftPattern: shift.shift?.shiftPattern._id,
            //     homeId: shift.shift?.homeId._id,
            // }).unwrap();

            // if (response.barcode) {
            //     setCurrentQrCode(response.barcode);
            //     setIsProcessing(false);
            //     setQrDialogOpen(true);
            //     return;
            // }

            throw new Error('Barcode not found');
        } catch (error: any) {
            console.error('Error generating QR code:', error);
            toast.error(error?.message || 'Error generating QR code. Please try again.');
            setIsProcessing(false);
            setQrDialogOpen(false);
        }
    };

    const handleRequestAttendance = async (shift: IShiftAssignment) => {
        try {
            setIsProcessing(true);
            setSelectedAssignment(shift);

            // Commented out actual implementation as per your source code
            // const qrCode = await generateAttendanceQR(shift).unwrap();
            // setCurrentAttendanceQrCode(qrCode.data);
            // setAttendanceQrDialogOpen(true);
        } catch (error) {
            console.error('Error generating attendance QR code:', error);
            toast.error(error?.message || 'Error generating attendance QR code. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (userAssignments) {
            const groupedAssignments = groupAssignmentsByDate(userAssignments);
            setAssignments(groupedAssignments);
        }
    }, [userAssignments]);

    // Update month change callback whenever currentDate changes
    useEffect(() => {
        onMonthChange(currentDate.month() + 1, currentDate.year());
    }, [currentDate]);

    const handleRequestTimesheet = async (shift: IShiftAssignment) => {
        setSelectedAssignment(shift);
        await handleTimesheetRequest(shift);
    };

    const groupAssignmentsByDate = (assignmentsData: IShiftAssignment[]): Record<string, IShiftAssignment[]> => {
        return assignmentsData?.reduce((acc, assignment) => {
            const dateKey = moment(assignment.shift?.date).format('YYYY-MM-DD');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(assignment);
            return acc;
        }, {} as Record<string, IShiftAssignment[]>);
    };

    // For date-fns compatibility
    const getDateFromMoment = (momentDate: moment.Moment) => {
        return new Date(momentDate.year(), momentDate.month(), momentDate.date());
    };

    // Updated navigation functions
    const navigateNext = () => {
        if (viewMode === "week") {
            const newDate = moment(currentDate).add(1, 'week');
            setCurrentDate(newDate);
        } else {
            const newDate = moment(currentDate).add(1, 'month');
            setCurrentDate(newDate);
        }
    };

    const navigatePrev = () => {
        if (viewMode === "week") {
            const newDate = moment(currentDate).subtract(1, 'week');
            setCurrentDate(newDate);
        } else {
            const newDate = moment(currentDate).subtract(1, 'month');
            setCurrentDate(newDate);
        }
    };

    // Get dates to display based on view mode
    const getDaysToDisplay = () => {
        const currentDateAsDate = getDateFromMoment(currentDate);

        if (viewMode === "week") {
            const start = startOfWeek(currentDateAsDate, { weekStartsOn: 1 }); // Start from Monday
            const end = endOfWeek(currentDateAsDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfMonth(currentDateAsDate);
            const end = endOfMonth(currentDateAsDate);
            return eachDayOfInterval({ start, end });
        }
    };

    const handleDayClick = (day: Date) => {
        // Convert date-fns date to moment for compatibility with existing logic
        const momentDay = moment(day);
        const dateKey = momentDay.format('YYYY-MM-DD');
        const dayAssignments = assignments[dateKey] || [];

        setSelectedDate(momentDay);
        setSelectedShifts(dayAssignments);
        dispatch(setSelectedDay(momentDay.date()));

        setIsViewShiftOpen(dayAssignments?.length > 0);
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
    };

    // Get week or month label for header
    const getHeaderLabel = () => {
        const currentDateAsDate = getDateFromMoment(currentDate);

        if (viewMode === "week") {
            const start = startOfWeek(currentDateAsDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDateAsDate, { weekStartsOn: 1 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return format(currentDateAsDate, 'MMMM yyyy');
        }
    };

    // Days of week for header labels
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Check if a date has shifts
    const hasShifts = (date: Date): boolean => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        return (assignments[dateKey]?.length || 0) > 0;
    };

    // Get shift count for a date
    const getShiftCount = (date: Date): number => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        return assignments[dateKey]?.length || 0;
    };


    // Loading overlay
    const LoadingOverlay = () => (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-700">Loading your shifts...</p>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="p-6">
                <div className="text-center text-red-500">
                    <p>Error loading shifts. Please try again later.</p>
                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                        <RotateCw className="h-4 w-4 mr-2" /> Retry
                    </Button>
                </div>
            </Card>
        );
    }

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
                            View and manage your assigned shifts. Click on a day with shifts to see details.
                        </p>

                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-200 rounded mr-2 border border-green-300"></div>
                                <span>Completed shifts</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded mr-2 border border-yellow-300"></div>
                                <span>Pending shifts</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded mr-2 border border-gray-300"></div>
                                <span>Unsigned shifts</span>
                            </div>
                            <div className="flex items-center">
                                <Badge className="bg-indigo-500">Today</Badge>
                                <span className="ml-2">Current day is highlighted</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-lg overflow-hidden relative">
                {/* Show loading overlay when processing */}
                {isProcessing && <LoadingOverlay />}

                <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={navigatePrev}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20 ml-1"
                                onClick={handleRefresh}
                                disabled={isRefreshing || isLoading}
                            >
                                <RotateCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                        <span className="text-lg font-medium">{getHeaderLabel()}</span>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={navigateNext}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardTitle>
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

                <CardContent
                    className="p-2 relative"
                >
                    {/* Swipe animation container */}
                    <div className="relative overflow-hidden">
                        <div
                            className="transition-transform duration-200 ease-out"
                            style={{
                                transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                                opacity: isSwiping ? 0.8 + (0.2 * (1 - Math.abs(swipeOffset) / 150)) : 1
                            }}
                        >
                            {/* MOBILE CALENDAR VIEW */}
                            <div className="block md:hidden">
                                {/* Mobile Week View - Now showing all 7 days */}
                                {viewMode === "week" && (
                                    <div className="flex flex-col">
                                        <div className="grid grid-cols-7 gap-1">
                                            {getDaysToDisplay().map((day, dayIdx) => {
                                                const isToday = isSameDay(day, new Date());
                                                const dayOfWeek = weekdays[dayIdx];
                                                const dateKey = moment(day).format('YYYY-MM-DD');
                                                const shiftCount = getShiftCount(day);
                                                const hasShiftsForDay = shiftCount > 0;
                                                const dayStyle = hasShiftsForDay ? getShiftDayStyle(dateKey) : {};

                                                return (
                                                    <div key={dayIdx} className="relative">
                                                        <div
                                                            className={`
                                                                p-1 rounded-lg cursor-pointer
                                                                ${isToday ? "border-2 border-primary" : "border"}
                                                                ${dayStyle.className}
                                                                flex flex-col h-16
                                                                transform transition-all duration-200 hover:shadow-md
                                                            `}
                                                            style={dayStyle.style}
                                                            onClick={() => handleDayClick(day)}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-[10px] font-medium text-gray-500">{dayOfWeek.substring(0, 1)}</div>
                                                                <div className={`text-sm font-bold ${isToday ? "text-primary" : "text-gray-700"}`}>
                                                                    {format(day, 'd')}
                                                                </div>
                                                            </div>


                                                            {hasShiftsForDay && (
                                                                <div className="mt-auto flex justify-center">
                                                                    {
                                                                        getShiftDayStyle(dateKey).shiftStatus.completed ? <Check className="h-4 w-4" />
                                                                            : (
                                                                                <Badge className={`text-[9px] h-4 min-w-4 flex items-center justify-center px-1 ${getShiftBadgeClass(assignments[dateKey])}`}>
                                                                                    {shiftCount}
                                                                                </Badge>
                                                                            )
                                                                    }
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
                                            {/* Empty cells for days before start of month */}
                                            {Array.from({ length: getDay(startOfMonth(getDateFromMoment(currentDate))) || 7 }).map((_, idx) => (
                                                <div key={`empty-start-${idx}`} className="h-10"></div>
                                            ))}

                                            {/* Actual month days */}
                                            {getDaysToDisplay().map((day, dayIdx) => {
                                                const isToday = isSameDay(day, new Date());
                                                const isCurrentMonth = isSameMonth(day, getDateFromMoment(currentDate));
                                                const dateKey = moment(day).format('YYYY-MM-DD');
                                                const shiftCount = getShiftCount(day);
                                                const hasShiftsForDay = shiftCount > 0;
                                                const dayStyle = hasShiftsForDay ? getShiftDayStyle(dateKey) : {};

                                                return (
                                                    <div
                                                        key={dayIdx}
                                                        className={`
                                                                h-12 p-1 rounded-lg cursor-pointer shadow-md flex flex-col relative
                                                                ${!isCurrentMonth ? "opacity-40" : ""}
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
                                                                {
                                                                    getShiftDayStyle(dateKey).shiftStatus.completed ? <Check className="h-4 w-4" />
                                                                        : (
                                                                            <Badge className={`text-[9px] h-4 min-w-4 flex items-center justify-center px-1 ${getShiftBadgeClass(assignments[dateKey])}`}>
                                                                                {shiftCount}
                                                                            </Badge>
                                                                        )
                                                                }
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
                                <div className="grid grid-cols-7 gap-2">
                                    {viewMode === "month" &&
                                        // Add empty cells for the days before the first day of the month
                                        Array.from({ length: getDay(startOfMonth(getDateFromMoment(currentDate))) || 7 }).map((_, i) => (
                                            <div key={`empty-desktop-${i}`} className="p-1"></div>
                                        ))
                                    }

                                    {getDaysToDisplay().map((day, dayIndex) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isCurrentMonth = isSameMonth(day, getDateFromMoment(currentDate));
                                        const dateKey = moment(day).format('YYYY-MM-DD');
                                        const shiftCount = getShiftCount(day);
                                        const hasShiftsForDay = shiftCount > 0;
                                        const dayStyle = hasShiftsForDay ? getShiftDayStyle(dateKey) : {};

                                        return (
                                            <div key={dayIndex} className="col-span-1">
                                                <div
                                                    className={`
                                                        h-[70px] w-full p-4 relative cursor-pointer
                                                        transform transition-all duration-200 hover:shadow-md rounded-lg
                                                        ${!isCurrentMonth ? "opacity-50" : ""}
                                                        ${isToday ? "ring-2 ring-primary" : "border"}
                                                    `}
                                                    style={{
                                                        background: hasShiftsForDay ? dayStyle.background : (isCurrentMonth ? 'white' : '#f9fafb'),
                                                        borderColor: hasShiftsForDay ? dayStyle.borderColor : '',
                                                    }}
                                                    onClick={() => handleDayClick(day)}
                                                >
                                                    <span
                                                        className={`
                                                            absolute top-1 left-1 px-1 rounded text-xs
                                                            ${isToday ? "font-semibold text-primary" : ""}
                                                        `}
                                                    >
                                                        {format(day, 'd')}
                                                    </span>

                                                    {hasShiftsForDay && (
                                                        <>
                                                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-gray-700">
                                                                {shiftCount}
                                                            </span>

                                                            {/* Add label at the bottom */}
                                                            <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                                                                <Badge
                                                                    className="text-xs py-0.5 text-white"
                                                                    style={{
                                                                        backgroundColor: dayStyle.borderColor || 'rgb(107 114 128)'
                                                                    }}
                                                                >
                                                                    Shifts
                                                                </Badge>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <ShiftViewDialog
                    open={isViewShiftOpen}
                    onClose={() => {
                        setIsViewShiftOpen(false);
                        setSelectedDate(null);
                    }}
                    selectedDate={selectedDate}
                    selectedShifts={selectedShifts}
                    onRequestTimesheet={handleRequestTimesheet}
                    onRequestAttendance={handleRequestAttendance}
                />

                {/* ShiftViewDialog, QRCodeDialog and AttendanceQRDialog */}
                {/* 

                <QRCodeDialog
                    open={qrDialogOpen}
                    onClose={() => setQrDialogOpen(false)}
                    selectedAssignment={selectedAssignment}
                    currentQrCode={currentQrCode}
                    userState={userState}
                />

                <AttendanceQRDialog
                    open={attendanceQrDialogOpen}
                    onClose={() => setAttendanceQrDialogOpen(false)}
                    selectedAssignment={selectedAssignment}
                    currentQrCode={currentAttendanceQrCode}
                    userState={userState}
                /> */}
            </Card>
        </div>
    );
};

export default StaffShiftCalendar;