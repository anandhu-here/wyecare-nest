import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    isBefore,
    isAfter,
    getDay,
    addDays,
    addWeeks,
    subWeeks,
    parseISO
} from 'date-fns';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Home,
    MoreVertical,
    Clipboard,
    Navigation,
    Check,
    RotateCw,
    AlertCircle,
    List,
    LayoutGrid,
    Filter,
    Search,
    Moon,
    Sun,
    Info
} from 'lucide-react';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';

// UI Components
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Calendar
} from '@/components/ui/calendar';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Types
import { IShiftAssignment } from '@wyecare-monorepo/shared-types';
import { selectUser } from '../auth/AuthSlice';
import { useGetUserAssignmentsQuery } from '../shift/shiftApi';
import { toast } from 'react-toastify';

// Import Shift Dialog
import ShiftViewDialog from './shift-components/view-assigned-shifts';

interface StaffScheduleViewProps {
    onMonthChange: (month: number, year: number) => void;
}

/**
 * StaffScheduleView - A modern hybrid list/calendar view for staff schedules
 */
const StaffScheduleView: React.FC<StaffScheduleViewProps> = ({ onMonthChange }) => {
    // State
    const [currentDate, setCurrentDate] = useState<moment.Moment>(moment());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
    const [listView, setListView] = useState<'list' | 'grid'>('list');
    const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
    const [showHelp, setShowHelp] = useState<boolean>(false);
    const [filterText, setFilterText] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
    const [selectedShifts, setSelectedShifts] = useState<IShiftAssignment[]>([]);
    const [isViewShiftOpen, setIsViewShiftOpen] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [assignments, setAssignments] = useState<Record<string, IShiftAssignment[]>>({});
    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        shiftType: 'all',
        location: 'all'
    });

    // Redux
    const dispatch = useDispatch();
    const userState = useSelector(selectUser);

    // API query
    const {
        data: userAssignments,
        isLoading,
        isError,
        refetch
    } = useGetUserAssignmentsQuery(
        {
            userId: userState?._id as string,
        },
        {
            // Skip if no user ID is available
            skip: !userState?._id
        }
    );

    // Group assignments by date when data is fetched
    useEffect(() => {
        if (userAssignments) {
            const groupedAssignments = groupAssignmentsByDate(userAssignments);
            setAssignments(groupedAssignments);
        }
    }, [userAssignments]);

    // Update month change callback whenever currentDate changes
    useEffect(() => {
        onMonthChange(currentDate.month() + 1, currentDate.year());
    }, [currentDate, onMonthChange]);

    // Helper Functions
    const groupAssignmentsByDate = (assignments: IShiftAssignment[] = []): Record<string, IShiftAssignment[]> => {
        return assignments.reduce((acc, assignment) => {
            const dateKey = moment(assignment.shift?.date).format('YYYY-MM-DD');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(assignment);
            return acc;
        }, {} as Record<string, IShiftAssignment[]>);
    };

    const isNightShift = (shift: IShiftAssignment): boolean => {
        if (!shift.shift?.shiftPattern?.timings) return false;

        const timing = shift.shift.shiftPattern.timings.find(
            t => t.careHomeId === shift.shift.homeId._id
        );

        if (!timing) return false;

        const startTime = timing.startTime;
        const endTime = timing.endTime;
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        return (startHour >= 20 || startHour <= 4) || (endHour <= 8 && endHour > 0);
    };

    const getShiftStatusColor = (shift: IShiftAssignment): string => {
        if (shift.timesheet?.status === 'approved') return 'bg-green-100 text-green-800 border-green-200';
        if (shift.timesheet?.status === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
        if (shift.status === 'signed') return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getShiftBadgeVariant = (shift: IShiftAssignment): string => {
        if (shift.timesheet?.status === 'approved') return 'success';
        if (shift.timesheet?.status === 'pending') return 'warning';
        if (shift.status === 'signed') return 'secondary';
        return 'outline';
    };

    const getTimePeriod = (): { startDate: Date, endDate: Date } => {
        const currentDateAsDate = new Date(currentDate.year(), currentDate.month(), currentDate.date());

        switch (viewMode) {
            case 'day':
                return {
                    startDate: currentDateAsDate,
                    endDate: currentDateAsDate
                };
            case 'week':
                return {
                    startDate: startOfWeek(currentDateAsDate, { weekStartsOn: 1 }),
                    endDate: endOfWeek(currentDateAsDate, { weekStartsOn: 1 })
                };
            case 'month':
                return {
                    startDate: startOfMonth(currentDateAsDate),
                    endDate: endOfMonth(currentDateAsDate)
                };
            default:
                return {
                    startDate: currentDateAsDate,
                    endDate: currentDateAsDate
                };
        }
    };

    const getDaysInPeriod = (): Date[] => {
        const { startDate, endDate } = getTimePeriod();
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const getShiftsForDay = (day: Date): IShiftAssignment[] => {
        const dateKey = moment(day).format('YYYY-MM-DD');
        return assignments[dateKey] || [];
    };

    const getDateTitle = (): string => {
        const { startDate, endDate } = getTimePeriod();

        if (viewMode === 'day') {
            return format(startDate, 'EEEE, MMMM d, yyyy');
        } else if (viewMode === 'week') {
            return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
        } else {
            return format(startDate, 'MMMM yyyy');
        }
    };

    const handleRefresh = async (): Promise<void> => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success('Schedule refreshed successfully');
        }, 1000);
    };

    const navigateNext = (): void => {
        let newDate;
        if (viewMode === 'day') {
            newDate = moment(currentDate).add(1, 'day');
        } else if (viewMode === 'week') {
            newDate = moment(currentDate).add(1, 'week');
        } else {
            newDate = moment(currentDate).add(1, 'month');
        }
        setCurrentDate(newDate);
    };

    const navigatePrev = (): void => {
        let newDate;
        if (viewMode === 'day') {
            newDate = moment(currentDate).subtract(1, 'day');
        } else if (viewMode === 'week') {
            newDate = moment(currentDate).subtract(1, 'week');
        } else {
            newDate = moment(currentDate).subtract(1, 'month');
        }
        setCurrentDate(newDate);
    };

    const navigateToday = (): void => {
        setCurrentDate(moment());
    };

    const handleDayClick = (day: Date): void => {
        const momentDay = moment(day);
        const dateKey = momentDay.format('YYYY-MM-DD');
        const dayShifts = assignments[dateKey] || [];

        setSelectedDate(momentDay);
        setSelectedShifts(dayShifts);
        setIsViewShiftOpen(dayShifts.length > 0);
    };

    const handleShiftClick = (shift: IShiftAssignment): void => {
        console.log('shift', shift);
        setSelectedShifts([shift]);
        setSelectedDate(moment(shift.shift?.date));
        setIsViewShiftOpen(true);
    };

    const getShiftColor = (shiftName: string): string => {
        if (!shiftName) return 'hsl(210, 85%, 55%)';

        let hash = 0;
        for (let i = 0; i < shiftName.length; i++) {
            hash = shiftName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 85%, 55%)`;
    };

    // Filter shifts based on search text and filter options
    const filteredShifts = useMemo(() => {
        let allShifts: IShiftAssignment[] = [];
        const days = getDaysInPeriod();

        // Collect all shifts for the current time period
        days.forEach(day => {
            const shiftsForDay = getShiftsForDay(day);
            allShifts = [...allShifts, ...shiftsForDay];
        });

        // Apply filters
        return allShifts.filter(shift => {
            // Text search
            const searchLower = filterText.toLowerCase();
            const shiftName = shift.shift?.shiftPattern?.name?.toLowerCase() || '';
            const homeName = shift.shift?.homeId?.name?.toLowerCase() || '';
            const shiftDate = moment(shift.shift?.date).format('MMM D, YYYY').toLowerCase();

            const textMatch = !filterText ||
                shiftName.includes(searchLower) ||
                homeName.includes(searchLower) ||
                shiftDate.includes(searchLower);

            // Status filter
            const statusMatch = filterOptions.status === 'all' ||
                (filterOptions.status === 'approved' && shift.timesheet?.status === 'approved') ||
                (filterOptions.status === 'pending' && shift.timesheet?.status === 'pending') ||
                (filterOptions.status === 'unsigned' && !shift.timesheet?.status);

            // Shift type filter
            const isNight = isNightShift(shift);
            const typeMatch = filterOptions.shiftType === 'all' ||
                (filterOptions.shiftType === 'day' && !isNight) ||
                (filterOptions.shiftType === 'night' && isNight);

            // Location filter - simplified for now
            const locationMatch = filterOptions.location === 'all' ||
                shift.shift?.homeId?.name === filterOptions.location;

            return textMatch && statusMatch && typeMatch && locationMatch;
        });
    }, [filterText, filterOptions, assignments, getDaysInPeriod, getShiftsForDay]);

    // Build a list of unique care homes for filtering
    const careHomes = useMemo(() => {
        const homes = new Set<string>();
        Object.values(assignments).flat().forEach(shift => {
            if (shift.shift?.homeId?.name) {
                homes.add(shift.shift.homeId.name);
            }
        });
        return Array.from(homes);
    }, [assignments]);

    // Render components
    const renderMiniCalendar = () => {
        const today = new Date();
        const [date, setDate] = useState<Date | undefined>(today);

        // Get days that have shifts
        const daysWithShifts = useMemo(() => {
            return Object.keys(assignments).map(dateKey => new Date(dateKey));
        }, [assignments]);

        // Custom day render function to show shift indicators
        const renderDay = (day: Date, selectedDates: Date[], props: any) => {
            // Format date for lookup
            const dateKey = moment(day).format('YYYY-MM-DD');
            const hasShifts = assignments[dateKey]?.length > 0;

            // Get shift statuses if available
            let statusIndicator = null;
            if (hasShifts) {
                const shifts = assignments[dateKey];
                const allApproved = shifts.every(s => s.timesheet?.status === 'approved');
                const somePending = shifts.some(s => s.timesheet?.status === 'pending');

                if (allApproved) {
                    statusIndicator = <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 bg-green-500 rounded-full" />;
                } else if (somePending) {
                    statusIndicator = <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 bg-amber-500 rounded-full" />;
                } else {
                    statusIndicator = <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-1 bg-blue-500 rounded-full" />;
                }
            }

            // Add a dot indicator for days with shifts
            return (
                <div className="relative">
                    {hasShifts && statusIndicator}
                </div>
            );
        };

        return (
            <div className="p-4">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                        setDate(newDate);
                        if (newDate) {
                            handleDayClick(newDate);
                        }
                    }}
                    className="rounded-md border"
                    components={{
                        Day: renderDay
                    }}
                    // Mark days with shifts 
                    modifiers={{
                        hasShift: daysWithShifts
                    }}
                    modifiersClassNames={{
                        hasShift: "font-bold"
                    }}
                />

                <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium">Legend</div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Approved</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        <span className="text-muted-foreground">Pending</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Scheduled</span>
                    </div>
                </div>

                <div className="flex justify-center mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateToday}
                        className="text-xs"
                    >
                        Today
                    </Button>
                </div>
            </div>
        );
    };

    const renderToolbar = () => (
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center p-4 bg-card">
            <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{getDateTitle()}</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={navigateToday}>
                    Today
                </Button>

                <div className="flex items-center rounded-md border">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-r-none border-r"
                        onClick={navigatePrev}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-l-none"
                        onClick={navigateNext}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Select
                    value={viewMode}
                    onValueChange={(value: string) => setViewMode(value as 'day' | 'week' | 'month')}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderSearchAndFilter = () => (
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center px-4 py-2 bg-card border-t">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search shifts..."
                    className="pl-8"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilter(!showFilter)}
                    className="gap-1"
                >
                    <Filter className="h-4 w-4" />
                    Filter
                </Button>

                <Button
                    variant={listView === 'list' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setListView('list')}
                >
                    <List className="h-4 w-4" />
                </Button>

                <Button
                    variant={listView === 'grid' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => setListView('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    const renderFilterBar = () => {
        if (!showFilter) return null;

        return (
            <div className="px-4 py-2 bg-card border-t">
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={filterOptions.status}
                        onValueChange={(value) => setFilterOptions({ ...filterOptions, status: value })}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="unsigned">Unsigned</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterOptions.shiftType}
                        onValueChange={(value) => setFilterOptions({ ...filterOptions, shiftType: value })}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Shift Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            <SelectItem value="day">Day Shifts</SelectItem>
                            <SelectItem value="night">Night Shifts</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filterOptions.location}
                        onValueChange={(value) => setFilterOptions({ ...filterOptions, location: value })}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {careHomes.map(home => (
                                <SelectItem key={home} value={home}>{home}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilterOptions({
                            status: 'all',
                            shiftType: 'all',
                            location: 'all'
                        })}
                    >
                        Reset
                    </Button>
                </div>
            </div>
        );
    };

    const renderShiftCard = (shift: IShiftAssignment) => {
        const isNight = isNightShift(shift);
        const startTime = shift.shift?.shiftPattern?.timings?.find(
            t => t.careHomeId === shift.shift?.homeId?._id
        )?.startTime || '00:00';
        const endTime = shift.shift?.shiftPattern?.timings?.find(
            t => t.careHomeId === shift.shift?.homeId?._id
        )?.endTime || '00:00';
        const shiftDate = moment(shift.shift?.date).format('ddd, MMM D');
        const statusVariant = getShiftBadgeVariant(shift);
        const isPast = moment(shift.shift?.date).isBefore(moment(), 'day');

        return (
            <Card
                key={shift._id}
                className={`
          transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer
          ${isPast ? 'opacity-70' : ''}
        `}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    handleShiftClick(shift);
                }}
            >
                <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Badge variant={statusVariant}>
                                {shift.timesheet?.status || shift.status || 'Unsigned'}
                            </Badge>
                            {isNight && (
                                <Badge variant="outline" className="gap-1 ml-1">
                                    <Moon className="h-3 w-3" /> Night
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-base font-semibold">
                            {shift.shift?.shiftPattern?.name || 'Shift'}
                        </CardTitle>
                    </div>
                    <Avatar className="h-10 w-10" style={{ backgroundColor: getShiftColor(shift.shift?.shiftPattern?.name || '') }}>
                        <AvatarFallback className="text-white font-medium">
                            {(shift.shift?.shiftPattern?.name || 'SH').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{shift.shift?.homeId?.name || 'Care Home'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{shiftDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{startTime} - {endTime}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-3 pt-0 flex justify-between">
                    <Button variant="ghost" size="sm" className="p-0">
                        View Details
                    </Button>
                    {shift.timesheet?.status === 'approved' && (
                        <Check className="h-4 w-4 text-green-600" />
                    )}
                </CardFooter>
            </Card>
        );
    };

    const renderShiftListItem = (shift: IShiftAssignment) => {
        const isNight = isNightShift(shift);
        const startTime = shift.shift?.shiftPattern?.timings?.find(
            t => t.careHomeId === shift.shift?.homeId?._id
        )?.startTime || '00:00';
        const endTime = shift.shift?.shiftPattern?.timings?.find(
            t => t.careHomeId === shift.shift?.homeId?._id
        )?.endTime || '00:00';
        const shiftDate = moment(shift.shift?.date).format('ddd, MMM D');
        const statusVariant = getShiftBadgeVariant(shift);
        const isPast = moment(shift.shift?.date).isBefore(moment(), 'day');

        return (
            <div
                key={shift._id}
                className={`
          flex items-center p-3 border rounded-md mb-2 hover:bg-accent cursor-pointer
          transition-colors ${isPast ? 'opacity-70' : ''}
        `}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling  
                    handleShiftClick(shift);
                }}
            >
                <Avatar className="h-10 w-10 mr-3" style={{ backgroundColor: getShiftColor(shift.shift?.shiftPattern?.name || '') }}>
                    <AvatarFallback className="text-white font-medium">
                        {(shift.shift?.shiftPattern?.name || 'SH').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{shift.shift?.shiftPattern?.name || 'Shift'}</h4>
                        <Badge variant={statusVariant} className="shrink-0">
                            {shift.timesheet?.status || shift.status || 'Unsigned'}
                        </Badge>
                        {isNight && (
                            <Badge variant="outline" className="gap-1 shrink-0">
                                <Moon className="h-3 w-3" /> Night
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1 mr-3">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{shiftDate}</span>
                        </div>
                        <div className="flex items-center gap-1 mr-3">
                            <Clock className="h-3 w-3" />
                            <span>{startTime} - {endTime}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                            <Home className="h-3 w-3 shrink-0" />
                            <span className="truncate">{shift.shift?.homeId?.name || 'Care Home'}</span>
                        </div>
                    </div>
                </div>

                <div>
                    {shift.timesheet?.status === 'approved' ? (
                        <Check className="h-5 w-5 text-green-600" />
                    ) : (
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderDaySection = (day: Date) => {
        const shifts = getShiftsForDay(day);
        const formattedDate = format(day, 'EEEE, MMMM d');
        const isToday = isSameDay(day, new Date());

        if (shifts.length === 0) return null;

        return (
            <div key={day.toISOString()} className="mb-6">
                <div className="flex items-center mb-2">
                    <h3 className={`text-lg font-semibold ${isToday ? 'text-primary' : ''}`}>
                        {formattedDate}
                        {isToday && <Badge variant="default" className="ml-2">Today</Badge>}
                    </h3>
                    <Separator className="flex-1 mx-4" />
                    <span className="text-sm text-muted-foreground">{shifts.length} shifts</span>
                </div>

                {listView === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shifts.map(shift => renderShiftCard(shift))}
                    </div>
                ) : (
                    <div>
                        {shifts.map(shift => renderShiftListItem(shift))}
                    </div>
                )}
            </div>
        );
    };

    const renderNoShifts = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-3 mb-4">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No shifts found</h3>
            <p className="text-muted-foreground max-w-xs">
                {filterText || showFilter ?
                    "Try adjusting your filters or search criteria" :
                    "There are no shifts scheduled for this time period"}
            </p>
            {(filterText || showFilter) && (
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                        setFilterText('');
                        setShowFilter(false);
                        setFilterOptions({
                            status: 'all',
                            shiftType: 'all',
                            location: 'all'
                        });
                    }}
                >
                    Clear Filters
                </Button>
            )}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="p-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: i + 1 }).map((_, j) => (
                                    <Skeleton key={j} className="h-[180px] rounded-md" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (isError) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-red-100 rounded-full p-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Error loading shifts</h3>
                    <p className="text-muted-foreground max-w-xs mb-4">
                        There was a problem loading your schedule. Please try again.
                    </p>
                    <Button onClick={handleRefresh}>
                        <RotateCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            );
        }

        if (filteredShifts.length === 0) {
            return renderNoShifts();
        }

        // Group shifts by day
        if (listView === 'list') {
            const days = getDaysInPeriod();
            return (
                <div className="p-4">
                    {days.map(day => renderDaySection(day))}
                </div>
            );
        } else {
            // Card grid view
            return (
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredShifts.map(shift => renderShiftCard(shift))}
                    </div>
                </div>
            );
        }
    };

    const renderHelpSection = () => {
        if (!showHelp) return null;

        return (
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
                        View and manage your assigned shifts. Click on a shift to see details.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                            <Badge variant="success" className="mr-2">approved</Badge>
                            <span>Completed and approved timesheets</span>
                        </div>
                        <div className="flex items-center">
                            <Badge variant="warning" className="mr-2">pending</Badge>
                            <span>Timesheet submitted but not approved</span>
                        </div>
                        <div className="flex items-center">
                            <Badge variant="secondary" className="mr-2">signed</Badge>
                            <span>Shift is signed but no timesheet</span>
                        </div>
                        <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                                <Moon className="h-3 w-3 mr-1" /> Night
                            </Badge>
                            <span>Night shift indicator</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Main render
    return (
        <div className="w-full mx-auto max-w-7xl">
            {/* Help section */}
            {renderHelpSection()}

            <Card className="shadow-lg overflow-hidden">
                {renderToolbar()}
                {renderSearchAndFilter()}
                {renderFilterBar()}

                <div className="flex flex-col md:flex-row">
                    {/* Mini calendar (hidden on mobile, shown in sheet) */}
                    <div className="hidden md:block md:w-72 border-r">
                        {renderMiniCalendar()}
                    </div>

                    {/* Main content area */}
                    <div className="flex-1">
                        <ScrollArea className="h-[70vh] md:h-[65vh]">
                            {renderContent()}
                        </ScrollArea>
                    </div>
                </div>

                {/* Mobile calendar sheet */}
                <Sheet open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                            <SheetTitle>Calendar</SheetTitle>
                        </SheetHeader>
                        {renderMiniCalendar()}
                    </SheetContent>
                </Sheet>

                {/* Shift view dialog */}
                {
                    isViewShiftOpen && selectedShifts.length > 0 && (
                        <ShiftViewDialog
                            open={isViewShiftOpen}
                            onClose={() => setIsViewShiftOpen(false)}
                            selectedDate={selectedDate}
                            selectedShifts={selectedShifts}
                            onRequestTimesheet={(shift) => {
                                // Handle timesheet request
                                console.log('Request timesheet', shift);
                            }}
                            onRequestAttendance={(shift) => {
                                // Handle attendance request
                                console.log('Request attendance', shift);
                            }}
                            refetch={() => refetch()}
                        />
                    )
                }
            </Card>
        </div>
    );
};

export default StaffScheduleView;