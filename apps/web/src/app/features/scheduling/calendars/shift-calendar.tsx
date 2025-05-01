import React, { useState, useEffect, useMemo } from 'react';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, getDay, addDays, subDays, parseISO, isToday as isDateToday,
    addMonths, isWithinInterval, isBefore, isAfter, startOfDay, endOfDay, getMonth, getYear
} from 'date-fns';
import {
    Calendar, ChevronLeft, ChevronRight, Info, RotateCcw, Plus, Filter,
    ArrowDownUp, CheckCircle2, Clock, AlertCircle, ChevronsRight, MoreHorizontal,
    Users, CalendarDays, Search, X, RefreshCw, ChevronDown
} from 'lucide-react';
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
    CardDescription,
    CardFooter,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from '@/lib/util';

// Import types
import { IShift } from '@wyecare-monorepo/shared-types';
import { LoadingOverlay } from '@/components/loading-overlay';
import { useMediaQuery } from '@/app/layouts/hook/media-query';
import { AppDispatch } from '@/redux/store';
import {
    useCreateMultipleShiftsMutation,
    useCreateShiftMutation,
    useGetPublishedShiftsQuery,
    useGetShiftsQuery,
    useUpdateShiftMutation
} from '@/app/features/shift/shiftApi';
import { selectCurrentOrganization, selectUser, selectPermissions } from '../../auth/AuthSlice';
import { toast } from 'react-toastify';
import IntegratedShiftDialog from '../components/shift-publish-dialog';
import ViewShiftDialog from '../components/view-dialog';
import { OrganizationCategory } from '@wyecare-monorepo/web-ui';
import moment from 'moment';

// Day cell interface
interface IDayCell {
    date: Date;
    shifts: IShift[];
    isCurrentMonth: boolean;
    isToday: boolean;
    onClick: () => void;
    viewHighlights: boolean;
    dayHeight?: string;
}

// Skeleton for loading state
const CalendarSkeleton: React.FC = () => {
    const { isMobile } = useMediaQuery();

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
                    <div className="p-1 border border-border rounded-lg flex flex-col gap-1"
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
        <Card className="bg-card/60 backdrop-blur-sm shadow-sm border-border/40">
            <CardContent className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-10 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-28 rounded-lg hidden md:block" />
                    </div>
                </div>

                <div className="flex gap-3 mb-6">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg hidden md:block" />
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-3 mt-2">
                    {renderWeekDays()}
                    {renderDays()}
                </div>
            </CardContent>
        </Card>
    );
};

// Empty state component
const EmptyCalendarState = ({
    onAddShift,
    message = "No shifts scheduled yet",
    canAddShifts = true
}: {
    onAddShift: () => void,
    message?: string,
    canAddShifts?: boolean
}) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">{message}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            No shifts have been scheduled for this period yet.
        </p>
        {canAddShifts && (
            <Button onClick={onAddShift} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add New Shift
            </Button>
        )}
    </div>
);

// Status Legend component showing shift status types
const ShiftLegend = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span>In Progress</span>
        </div>
    </div>
);

// Calendar filters component
const CalendarFilters = ({
    viewHighlights,
    setViewHighlights,
    filterStatus,
    setFilterStatus,
    showLegend,
    setShowLegend
}: {
    viewHighlights: boolean;
    setViewHighlights: (value: boolean) => void;
    filterStatus: string | null;
    setFilterStatus: (value: string | null) => void;
    showLegend: boolean;
    setShowLegend: (value: boolean) => void;
}) => (
    <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex items-center gap-1.5">
            <Switch
                id="highlights"
                checked={viewHighlights}
                onCheckedChange={setViewHighlights}
                size="sm"
            />
            <Label htmlFor="highlights" className="text-sm cursor-pointer">
                Highlights
            </Label>
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    {filterStatus ? (
                        <span className="capitalize">{filterStatus} Shifts</span>
                    ) : (
                        <span>All Shifts</span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter Shifts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus(null)} className={!filterStatus ? "bg-accent/50" : ""}>
                    All Shifts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('pending')} className={filterStatus === 'pending' ? "bg-accent/50" : ""}>
                    Pending Shifts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('completed')} className={filterStatus === 'completed' ? "bg-accent/50" : ""}>
                    Completed Shifts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('inProgress')} className={filterStatus === 'inProgress' ? "bg-accent/50" : ""}>
                    In Progress Shifts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLegend(!showLegend)}>
                    {showLegend ? "Hide" : "Show"} Legend
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);

// Day cell component for month view
const DayCell: React.FC<IDayCell> = ({
    date,
    shifts,
    isCurrentMonth,
    isToday,
    onClick,
    viewHighlights,
    dayHeight = "min-h-[110px]"
}) => {
    // Calculate shift statuses
    const shiftStatuses = shifts.reduce((acc, shift) => ({
        completed: acc.completed + (shift.status === 'completed' || shift.status === 'approved' ? 1 : 0),
        pending: acc.pending + (shift.status === 'pending' ? 1 : 0),
        inProgress: acc.inProgress + (shift.status === 'inProgress' ? 1 : 0),
        total: acc.total + 1
    }), { completed: 0, pending: 0, inProgress: 0, total: 0 });

    // Generate color and style based on shift statuses
    const getHighlightStyles = () => {
        if (!viewHighlights || shifts.length === 0) return "";

        if (shiftStatuses.completed === shiftStatuses.total && shiftStatuses.total > 0) {
            return "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800";
        } else if (shiftStatuses.pending > 0) {
            return "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800";
        } else if (shiftStatuses.inProgress > 0) {
            return "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800";
        } else if (shiftStatuses.total > 0) {
            return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800";
        }

        return "";
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                `${dayHeight} p-2 rounded-lg cursor-pointer border transition-all duration-200`,
                "hover:shadow-md hover:-translate-y-0.5",
                isCurrentMonth
                    ? "bg-card shadow-sm"
                    : "bg-muted/30 text-muted-foreground border-border/20",
                isToday && "ring-2 ring-primary ring-offset-1",
                getHighlightStyles()
            )}
        >
            {/* Date number */}
            <div className="flex justify-between items-start mb-1">
                <div className={cn(
                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground" : ""
                )}>
                    {format(date, 'd')}
                </div>

                {/* Month label for first and last day of month */}
                {(!isCurrentMonth || date.getDate() === 1) && (
                    <span className="text-xs text-muted-foreground font-medium">
                        {format(date, 'MMM')}
                    </span>
                )}
            </div>

            {/* Shift counts and indicators */}
            {shifts.length > 0 ? (
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">{shifts.length} shift{shifts.length > 1 ? 's' : ''}</span>
                        {/* Color status dot indicators */}
                        <div className="flex items-center gap-1">
                            {shiftStatuses.completed > 0 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {shiftStatuses.completed} completed
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {shiftStatuses.pending > 0 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {shiftStatuses.pending} pending
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {shiftStatuses.inProgress > 0 && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {shiftStatuses.inProgress} in progress
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {/* List of shift types - show max 2, then "+X more" */}
                    <div className="space-y-1">
                        {shifts.slice(0, 2).map((shift, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 text-xs truncate py-0.5 px-1.5 rounded bg-background/60 border border-border/30"
                            >
                                {shift.type === 'day' ? <Sun className="h-3 w-3 text-amber-500" /> :
                                    shift.type === 'night' ? <Moon className="h-3 w-3 text-indigo-500" /> :
                                        <Clock className="h-3 w-3 text-blue-500" />}
                                <span className="truncate">{shift.count || 1}× {shift.title || shift.shiftType?.name || 'Shift'}</span>
                            </div>
                        ))}

                        {shifts.length > 2 && (
                            <div className="text-xs text-muted-foreground px-1.5">
                                +{shifts.length - 2} more
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                isCurrentMonth && (
                    <div className="flex items-center justify-center h-12 mt-2">
                        <span className="text-xs text-muted-foreground italic">No shifts</span>
                    </div>
                )
            )}
        </div>
    );
};

// Helper for time-of-day icon
const Sun = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

const Moon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

// Quick navigation component
const QuickNavigate = ({ onSelect }: { onSelect: (option: string) => void }) => (
    <div className="flex flex-wrap gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => onSelect("today")}>
            Today
        </Button>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span className="hidden xs:inline">Jump to</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => onSelect("thisWeek")}>
                    This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelect("nextWeek")}>
                    Next Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelect("nextMonth")}>
                    Next Month
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);

// Week view row component
const WeekRow = ({
    days,
    onClick,
    viewHighlights
}: {
    days: Date[],
    onClick: (date: Date) => void,
    viewHighlights: boolean
}) => {
    return (
        <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
                const isToday = isDateToday(day);
                const dateKey = format(day, 'yyyy-MM-dd');

                // This would be filled with actual shift data in the main component
                const shifts: IShift[] = [];

                return (
                    <DayCell
                        key={index}
                        date={day}
                        shifts={shifts}
                        isCurrentMonth={true}
                        isToday={isToday}
                        onClick={() => onClick(day)}
                        viewHighlights={viewHighlights}
                        dayHeight="min-h-[90px]"
                    />
                );
            })}
        </div>
    );
};

// Custom hook for organizationCategory
const useOrganizationCategory = () => {
    const currentOrganization = useSelector(selectCurrentOrganization);

    return useMemo(() => {
        if (currentOrganization?.category) {
            return currentOrganization.category as OrganizationCategory;
        }

        // Legacy support
        if (currentOrganization?.type === 'agency') {
            return OrganizationCategory.SERVICE_PROVIDER;
        } else if (currentOrganization?.type === 'home') {
            return OrganizationCategory.CARE_HOME;
        }

        return OrganizationCategory.OTHER;
    }, [currentOrganization]);
};

// Main Calendar Component
const EmployerShiftCalendar: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isMobile, isTablet } = useMediaQuery();

    // State
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState("month");
    const [showLegend, setShowLegend] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedShifts, setSelectedShifts] = useState<IShift[]>([]);
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [isViewShiftOpen, setIsViewShiftOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [shiftToEdit, setShiftToEdit] = useState<IShift | null>(null);
    const [shifts, setShifts] = useState<Record<string, IShift[]>>({});
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [viewHighlights, setViewHighlights] = useState(true);
    const [search, setSearch] = useState('');

    // Selectors
    const currentOrganization = useSelector(selectCurrentOrganization);
    const user = useSelector(selectUser);
    const permissions = useSelector(selectPermissions);
    const organizationCategory = useOrganizationCategory();

    // API Hooks
    const [createShift] = useCreateShiftMutation();
    const [updateShift] = useUpdateShiftMutation();
    const [createMultipleShifts] = useCreateMultipleShiftsMutation();

    // RTK Query hook - unified for all organization types
    const {
        data: organizationShifts,
        isLoading: shiftsLoading,
        isError: shiftsError,
        refetch: refetchShifts
    } = useGetPublishedShiftsQuery({
        orgId: currentOrganization?._id as string,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
    }, {
        skip: !currentOrganization?._id
    });

    // Process shifts when data is loaded
    useEffect(() => {
        if (organizationShifts) {
            const groupedShifts = groupShiftsByDate(organizationShifts);
            setShifts(groupedShifts);
        }
    }, [organizationShifts]);

    // Group shifts by date
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

    // Filter shifts based on search and filter criteria
    const filteredShifts = useMemo(() => {
        let result = { ...shifts };

        // Apply status filter
        if (filterStatus) {
            Object.keys(result).forEach(date => {
                result[date] = result[date].filter(shift =>
                    shift.status === filterStatus
                );

                // Remove date if no shifts left
                if (result[date].length === 0) {
                    delete result[date];
                }
            });
        }

        // Apply search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            Object.keys(result).forEach(date => {
                result[date] = result[date].filter(shift =>
                    (shift.title && shift.title.toLowerCase().includes(searchLower)) ||
                    (shift.shiftType?.name && shift.shiftType.name.toLowerCase().includes(searchLower))
                );

                // Remove date if no shifts left
                if (result[date].length === 0) {
                    delete result[date];
                }
            });
        }

        return result;
    }, [shifts, filterStatus, search]);

    // Calendar view helpers
    const getDaysToDisplay = () => {
        if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start from Sunday
            const end = endOfWeek(currentDate, { weekStartsOn: 0 });
            return eachDayOfInterval({ start, end });
        } else {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);

            // Get the start of the first week
            const monthStartDay = getDay(start);
            const startOfCalendar = subDays(start, monthStartDay);

            // Get the end of the last week
            const monthEndDay = getDay(end);
            const endOfCalendar = addDays(end, 6 - monthEndDay);

            return eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });
        }
    };

    // Get shifts for a specific date
    const getShiftsForDate = (date: Date): IShift[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return filteredShifts[dateKey] || [];
    };

    // Navigation functions
    const navigateNext = () => {
        if (viewMode === "week") {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            const newDate = addMonths(currentDate, 1);
            setCurrentDate(newDate);
            dispatch(setSelectedMonth(newDate.getMonth() + 1));
            dispatch(setSelectedYear(newDate.getFullYear()));
        }
    };

    const navigatePrev = () => {
        if (viewMode === "week") {
            setCurrentDate(subDays(currentDate, 7));
        } else {
            const newDate = addMonths(currentDate, -1);
            setCurrentDate(newDate);
            dispatch(setSelectedMonth(newDate.getMonth() + 1));
            dispatch(setSelectedYear(newDate.getFullYear()));
        }
    };

    // Quick select functions
    const quickSelect = (option: string) => {
        let newDate;
        switch (option) {
            case "today":
                newDate = new Date();
                break;
            case "thisWeek":
                newDate = new Date();
                setViewMode("week");
                break;
            case "nextWeek":
                newDate = addDays(new Date(), 7);
                setViewMode("week");
                break;
            case "nextMonth":
                newDate = addMonths(new Date(), 1);
                break;
            default:
                newDate = new Date();
        }
        setCurrentDate(newDate);
        dispatch(setSelectedMonth(newDate.getMonth() + 1));
        dispatch(setSelectedYear(newDate.getFullYear()));
    };

    // Get header label for current view
    const getHeaderLabel = () => {
        if (viewMode === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            const end = endOfWeek(currentDate, { weekStartsOn: 0 });

            // If same month
            if (getMonth(start) === getMonth(end)) {
                return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
            }
            // If different months
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            return format(currentDate, 'MMMM yyyy');
        }
    };

    // Handle when a day is clicked
    const handleDayClick = (day: Date) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayShifts = shifts[dateKey] || [];

        setSelectedDate(day);
        setSelectedShifts(dayShifts);
        dispatch(setSelectedDay(day.getDate()));

        // Either show existing shifts or open dialog to add new shifts
        if (dayShifts.length > 0) {
            setIsViewShiftOpen(true);
        } else if (canAddShifts) {
            setIsShiftDialogOpen(true);
        }
    };

    // Handler for adding new shifts
    const handleAddShift = (newShifts: IShift[]) => {
        setShifts((prevShifts) => {
            const updatedShifts = { ...prevShifts };
            newShifts.forEach((shift) => {
                const dateKey = shift.date;
                if (!updatedShifts[dateKey]) {
                    updatedShifts[dateKey] = [];
                }
                updatedShifts[dateKey].push(shift);
            });
            return updatedShifts;
        });
        setIsShiftDialogOpen(false);
    };

    // Handler for editing shifts
    const handleEditShift = (shift: IShift) => {
        setShiftToEdit(shift);
        setIsEditMode(true);
        setIsShiftDialogOpen(true);
        setIsViewShiftOpen(false);
    };

    // Handler for updating shifts
    const handleUpdateShift = (updatedShift: IShift) => {
        setShifts((prevShifts) => {
            const updatedShifts = { ...prevShifts };
            const dateKey = updatedShift.date;
            if (updatedShifts[dateKey]) {
                updatedShifts[dateKey] = updatedShifts[dateKey].map((shift) =>
                    shift._id === updatedShift._id ? updatedShift : shift
                );
            }
            return updatedShifts;
        });

        setIsShiftDialogOpen(false);
        setShiftToEdit(null);
        setIsEditMode(false);
    };

    // Refresh data
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await refetchShifts();
            toast.success("Calendar refreshed successfully");

            setTimeout(() => {
                setRefreshing(false);
            }, 500);
        } catch (error) {
            console.error(error);
            toast.error('Error refreshing shifts');
            setRefreshing(false);
        }
    };

    // Check if user can add shifts
    const canAddShifts = useMemo(() => {
        // Check based on organization category and permissions
        const shiftsEnabledForCategory = [
            OrganizationCategory.HOSPITAL,
            OrganizationCategory.CARE_HOME,
            OrganizationCategory.HEALTHCARE,
            OrganizationCategory.HOSPITALITY,
            OrganizationCategory.RETAIL,
            OrganizationCategory.MANUFACTURING,
            OrganizationCategory.SERVICE_PROVIDER
        ].includes(organizationCategory);

        if (!shiftsEnabledForCategory) return false;

        // Admin/owner can always add shifts
        if (user?.role === 'admin' || user?.role === 'owner') return true;

        // Check if user has necessary permissions
        return permissions?.includes('edit_schedules') ||
            permissions?.includes('create_shifts');
    }, [organizationCategory, user?.role, permissions]);

    // Generate day cells for month view
    const renderMonthView = () => {
        const days = getDaysToDisplay();
        return (
            <>
                {/* Days of week header */}
                <div className="grid grid-cols-7 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <div key={i} className="text-center text-sm font-medium text-muted-foreground">
                            {isMobile ? day.substring(0, 1) : day}
                        </div>
                    ))}
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {days.map((day, dayIndex) => {
                        const isToday = isDateToday(day);
                        const isThisMonth = isSameMonth(day, currentDate);
                        const dayShifts = getShiftsForDate(day);

                        return (
                            <DayCell
                                key={dayIndex}
                                date={day}
                                shifts={dayShifts}
                                isCurrentMonth={isThisMonth}
                                isToday={isToday}
                                onClick={() => handleDayClick(day)}
                                viewHighlights={viewHighlights}
                            />
                        );
                    })}
                </div>
            </>
        );
    };

    // Generate week view
    const renderWeekView = () => {
        const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
        const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <>
                {/* Days of week header with date */}
                <div className="grid grid-cols-7 mb-3">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-center">
                            <div className="text-sm font-medium text-muted-foreground">
                                {isMobile ? format(day, 'E')[0] : format(day, 'EEE')}
                            </div>
                            <div className={cn(
                                "mx-auto mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm",
                                isDateToday(day) ? "bg-primary text-primary-foreground font-medium" : ""
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Week grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-3">
                    {weekDays.map((day, dayIndex) => {
                        const isToday = isDateToday(day);
                        const dayShifts = getShiftsForDate(day);

                        return (
                            <DayCell
                                key={dayIndex}
                                date={day}
                                shifts={dayShifts}
                                isCurrentMonth={true}
                                isToday={isToday}
                                onClick={() => handleDayClick(day)}
                                viewHighlights={viewHighlights}
                                dayHeight="min-h-[130px] md:min-h-[150px]"
                            />
                        );
                    })}
                </div>
            </>
        );
    };

    // Check if there are any shifts to display
    const hasShifts = useMemo(() => {
        return Object.keys(filteredShifts).length > 0;
    }, [filteredShifts]);

    // Determine loading and error states
    if (shiftsLoading) return <CalendarSkeleton />;

    if (shiftsError) {
        return (
            <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">Error Loading Calendar</h3>
                        <p className="text-muted-foreground mb-6">
                            We couldn't load your shift data. Please try again.
                        </p>
                        <Button variant="default" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full">
            <Card className="border border-border/40 shadow-sm bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl md:text-2xl font-semibold">
                                {organizationCategory === OrganizationCategory.HOSPITAL ? "Hospital" :
                                    organizationCategory === OrganizationCategory.CARE_HOME ? "Care Home" : "Staff"} Shift Calendar
                            </CardTitle>
                            <CardDescription className="text-blue-100 mt-1">
                                Manage your organization's shifts and schedules
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-3">
                            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                                <TabsList className="bg-white/20 border border-white/30">
                                    <TabsTrigger value="week" className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white">
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger value="month" className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white">
                                        Month
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={navigatePrev}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={() => quickSelect('today')}>
                                                <span className="hidden sm:inline-block whitespace-nowrap">
                                                    {getHeaderLabel()}
                                                </span>
                                                <span className="sm:hidden">
                                                    {viewMode === "week" ? "Week" : format(currentDate, 'MMM yy')}
                                                </span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Click to return to today
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/30" onClick={navigateNext}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-6">
                    {/* Top Controls Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex-1">
                            <QuickNavigate onSelect={quickSelect} />
                        </div>

                        <div className="flex flex-col xs:flex-row gap-4">
                            {/* Search input */}
                            <div className="relative w-full xs:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search shifts..."
                                    className="pl-9 h-9 w-full xs:w-[200px] lg:w-[250px]"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0.5 top-0.5 h-8 w-8 text-muted-foreground"
                                        onClick={() => setSearch('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Add Shift Button */}
                            {canAddShifts && (
                                <Button
                                    size="sm"
                                    className="h-9"
                                    onClick={() => {
                                        setSelectedDate(new Date());
                                        setIsEditMode(false);
                                        setIsShiftDialogOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1.5" /> Add Shift
                                </Button>
                            )}

                            {/* Refresh Button */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ?
                                    <RefreshCw className="h-4 w-4 animate-spin" /> :
                                    <RotateCcw className="h-4 w-4" />
                                }
                            </Button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <CalendarFilters
                        viewHighlights={viewHighlights}
                        setViewHighlights={setViewHighlights}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        showLegend={showLegend}
                        setShowLegend={setShowLegend}
                    />

                    {/* Status Tag Legend */}
                    <AnimatePresence>
                        {showLegend && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mb-5 p-3 bg-muted/50 rounded-lg">
                                    <ShiftLegend />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Calendar Grid */}
                    <div className="mt-1 pb-2">
                        {hasShifts || !canAddShifts ? (
                            viewMode === "month" ? renderMonthView() : renderWeekView()
                        ) : (
                            <EmptyCalendarState
                                onAddShift={() => {
                                    setSelectedDate(new Date());
                                    setIsShiftDialogOpen(true);
                                }}
                                canAddShifts={canAddShifts}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            <LoadingOverlay isVisible={refreshing} />

            {/* Dialogs */}
            <IntegratedShiftDialog
                open={isShiftDialogOpen}
                onClose={() => setIsShiftDialogOpen(false)}
                selectedDate={selectedDate ? moment(selectedDate) : null}
                onAddShift={handleAddShift}
                onEditShift={handleUpdateShift}
                shiftToEdit={isEditMode ? shiftToEdit : null}
                onClickCreateShiftType={() => {
                    // Legacy support for creating shift types
                    setIsShiftDialogOpen(false);
                }}
                isEditMode={isEditMode}
            />


            <ViewShiftDialog
                open={isViewShiftOpen}
                onClose={() => setIsViewShiftOpen(false)}
                selectedDate={selectedDate ? moment(selectedDate) : null}
                shifts={selectedShifts}
                onShiftsUpdate={(updatedShifts) => {
                    if (selectedDate) {
                        const dateKey = format(selectedDate, 'yyyy-MM-dd');
                        setShifts((prevShifts) => ({
                            ...prevShifts,
                            [dateKey]: updatedShifts
                        }));
                        setSelectedShifts(updatedShifts);
                    }
                }}
                onEditClick={handleEditShift}
                onAddFurther={() => {
                    setIsEditMode(false);
                    setIsShiftDialogOpen(true);
                    setIsViewShiftOpen(false);
                }}
            />
        </div>
    );
};

export default EmployerShiftCalendar;