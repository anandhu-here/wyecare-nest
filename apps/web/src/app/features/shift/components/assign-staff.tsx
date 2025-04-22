import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';


// Import shadcn components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    RefreshCcw,
    RotateCcw,
    Search,
    X,
    Filter,
    Users,
    Check,
    UserX,
    Info,
    Clock,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Capacitor } from '@capacitor/core';
import { useMediaQuery } from '@/app/layouts/hook/media-query';
import { useDispatch, useSelector } from 'react-redux';
import { useAssignUsersToShiftMutation, useUnassignUserFromShiftMutation } from '../shiftApi';
import { LoadingOverlay } from '@/components/loading-overlay';
import { useGetAvailableStaffForShiftQuery } from '../../organization/organizationApi';

const isIOS = Capacitor.getPlatform() === 'ios';

// Enhanced Staff Card Component with Mobile Optimization
const StaffCard = ({ staff, isSelected, onToggle, disabled, isMobile }: any) => {
    const { isAvailable, isOnLeave } = staff.availability;

    // Mobile optimized card
    if (isMobile) {
        return (
            <div
                onClick={() => !disabled && onToggle()}
                className={`relative p-3 rounded-lg border transition-all duration-200 mb-2.5
          ${disabled
                        ? 'cursor-not-allowed bg-gray-50'
                        : 'cursor-pointer active:bg-primary-50 hover:border-primary-300'
                    }
          ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
            >
                {/* Status Badge */}
                <div className="absolute -top-2 right-2 z-10">
                    <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border text-xs
            ${isOnLeave
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : !isAvailable
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                    >
                        {isOnLeave
                            ? 'On Leave'
                            : !isAvailable
                                ? 'Unavailable'
                                : 'Available'}
                    </span>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Checkbox */}
                    <div
                        className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
            ${isSelected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-gray-300'
                            } ${disabled ? 'opacity-50' : ''}`}
                    >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage
                            src={staff.user.avatarUrl}
                            alt={`${staff.user.firstName} ${staff.user.lastName}`}
                        />
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                            {staff.user.firstName?.[0]}
                            {staff.user.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {staff.user.firstName} {staff.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                            {staff.role}
                            {!isAvailable && !isOnLeave && staff.availability.reason && (
                                <span className="ml-1 text-red-500">
                                    • {staff.availability.reason}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Original desktop version
    return (
        <div
            onClick={() => !disabled && onToggle()}
            className={`relative p-4 rounded-lg border transition-all duration-200 mt-6
        ${disabled
                    ? 'cursor-not-allowed bg-gray-50'
                    : 'cursor-pointer hover:shadow-md hover:border-primary-300'
                }
        ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
        >
            {/* Status Badge */}
            <div className="absolute -top-3 left-4">
                <span
                    className={`px-3 py-1 text-xs font-medium rounded-full border
          ${isOnLeave
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : !isAvailable
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-primary-50 text-primary-700 border-primary-200'
                        }`}
                >
                    {isOnLeave
                        ? 'On Leave'
                        : !isAvailable
                            ? staff.availability.reason || 'Not Available'
                            : 'Available'}
                </span>
            </div>

            <div className="flex items-center space-x-3">
                {/* Checkbox */}
                <div
                    className={`flex-shrink-0 h-5 w-5 rounded border-2 transition-colors
          ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                        } ${disabled ? 'opacity-50' : ''}`}
                >
                    {isSelected && (
                        <svg
                            className="h-4 w-4 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    )}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                    {staff.user.avatarUrl ? (
                        <img
                            src={staff.user.avatarUrl}
                            alt={`${staff.user.firstName} ${staff.user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 text-sm font-medium">
                                {staff.user.firstName?.[0]}
                                {staff.user.lastName?.[0]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {staff.user.firstName} {staff.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{staff.role}</p>
                </div>
            </div>
        </div>
    );
};

// Assignment Summary Component - Mobile Optimized
const AssignmentSummary = ({
    assignedStaff,
    remainingCount,
    onEditStaff,
    isMobile,
}: any) => {
    if (isMobile) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 mb-3">
                <div className="px-4 py-3 border-b">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">
                            Required Staff
                        </h3>
                        <div className="flex items-center">
                            <Badge
                                variant={remainingCount > 0 ? 'outline' : 'success'}
                                className="ml-2"
                            >
                                <Users className="h-3 w-3 mr-1" />
                                {remainingCount > 0 ? `${remainingCount} needed` : 'Complete'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {assignedStaff.length > 0 && (
                    <div className="p-3">
                        <h3 className="text-xs font-medium text-gray-500 mb-2">
                            Currently Assigned
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {assignedStaff.map((staff) => (
                                <span
                                    key={staff.user}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs
                  bg-blue-50 text-blue-700 border border-blue-100"
                                >
                                    {staff.name}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditStaff(staff.user);
                                        }}
                                        className="ml-1 text-blue-400 hover:text-blue-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Original desktop version
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Required Staff</h3>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                        {remainingCount > 0 ? remainingCount : 0} more needed
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Currently Assigned
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {assignedStaff.map((staff) => (
                            <span
                                key={staff.user}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm
                  bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                {staff.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Search and Filter Component - Mobile Optimized
const SearchAndFilter = ({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    isMobile,
    showFilters,
    setShowFilters,
}: any) => {
    if (isMobile) {
        return (
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9 h-10 text-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {showFilters && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-2 border">
                        <div className="mb-1">
                            <label className="text-xs font-medium text-gray-700 block mb-1.5">
                                Filter by role
                            </label>
                            <Tabs
                                value={roleFilter}
                                onValueChange={onRoleFilterChange}
                                className="w-full"
                            >
                                <TabsList className="grid grid-cols-4 w-full h-8">
                                    <TabsTrigger value="all" className="text-xs">
                                        All
                                    </TabsTrigger>
                                    <TabsTrigger value="carer" className="text-xs">
                                        Carers
                                    </TabsTrigger>
                                    <TabsTrigger value="nurse" className="text-xs">
                                        Nurses
                                    </TabsTrigger>
                                    <TabsTrigger value="senior_carer" className="text-xs">
                                        Sr. Carers
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Original desktop version
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="carer">Carers</SelectItem>
                    <SelectItem value="nurse">Nurses</SelectItem>
                    <SelectItem value="senior_carer">Senior Carers</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

interface AssignStaffDialogProps {
    open: boolean;
    onClose: () => void;
    shift: {
        _id: string;
        date: string;
        count: number;
        homeId: { _id: string; name: string };
        shiftPattern: { _id: string; name: string };
        shiftAssignments?: Array<{ user: string }>;
    };
    onAssign: (staffIds: string[]) => void;
    onCallback?: () => void;
}

// Main Dialog Component
const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({
    open,
    onClose,
    shift,
    onAssign,
    onCallback,
}) => {
    if (!open) return null;

    const { isMobile } = useMediaQuery();

    const dispatch = useDispatch();
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [similarShifts, setSimilarShifts] = useState<any[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [alreadyAssigned, setAlreadyAssigned] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [currentFilterTab, setCurrentFilterTab] = useState('available');

    const [assignCarers] = useAssignUsersToShiftMutation();

    const {
        data: availableStaffResponse,
        isLoading,
        isError,
        refetch: refetchAvailableStaff,
    } = useGetAvailableStaffForShiftQuery(
        {
            shiftDate: shift.date,
            careHomeId: shift.homeId._id,
            shiftPatternId: shift.shiftPattern._id,
        },
        {
            skip: !open,
            refetchOnMountOrArgChange: true,
        }
    );

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetchAvailableStaff();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        if (shift.shiftAssignments) {
            setAlreadyAssigned(
                shift.shiftAssignments.map((assignment) => ({
                    user: assignment.user,
                    name: (() => {
                        const staff = availableStaffResponse?.data.find(
                            (s) => s.user._id === assignment.user
                        );
                        return `${staff?.user.firstName || ''} ${staff?.user.lastName || ''
                            }`;
                    })(),
                })) || []
            );
        }
    }, [shift, availableStaffResponse?.data]);

    const assignedStaffIds = useMemo(
        () => shift.shiftAssignments?.map((assignment) => assignment.user) || [],
        [shift.shiftAssignments]
    );

    const filteredStaff = useMemo(() => {
        if (!availableStaffResponse?.data) return [];

        return availableStaffResponse.data.filter((staff) => {
            const nameMatch = `${staff.user.firstName} ${staff.user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const roleMatch = roleFilter === 'all' || staff.role === roleFilter;
            const isUnassigned = !assignedStaffIds.includes(staff.user._id);

            // On mobile, we add availability filtering
            if (isMobile && currentFilterTab !== 'all') {
                if (currentFilterTab === 'available' && !staff.availability.isAvailable)
                    return false;
                if (
                    currentFilterTab === 'unavailable' &&
                    staff.availability.isAvailable
                )
                    return false;
            }

            return nameMatch && roleMatch && isUnassigned;
        });
    }, [
        availableStaffResponse?.data,
        searchTerm,
        roleFilter,
        assignedStaffIds,
        currentFilterTab,
        isMobile,
    ]);

    const [unassignUserFromShift, { isLoading: isUnassigning }] =
        useUnassignUserFromShiftMutation();

    const handleStaffToggle = (staffId: string) => {
        setSelectedStaff((prev) =>
            prev.includes(staffId)
                ? prev.filter((id) => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleAssign = async (assignToAll: boolean) => {
        if (selectedStaff.length === 0) return;

        try {
            setIsAssigning(true);

            const assignments = assignToAll
                ? [shift, ...similarShifts].map((s) => ({
                    shiftId: s._id,
                    userIds: selectedStaff,
                }))
                : [{ shiftId: shift._id, userIds: selectedStaff }];

            const result = await assignCarers({
                assignments,
                shiftId: shift._id,
            }).unwrap();

            // dispatch(
            //     showSnack({
            //         message: 'Staff assigned successfully',
            //         color: 'success',
            //     })
            // );
            onClose();
            if (onCallback) onCallback();
        } catch (error) {
            console.log(error);
            // dispatch(
            //     showSnack({
            //         message: 'Failed to assign staff. Please try again.',
            //         color: 'error',
            //     })
            // );
        } finally {
            setIsAssigning(false);
            setShowConfirmation(false);
            setSelectedStaff([]);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        try {
            await unassignUserFromShift({
                shiftId: shift._id,
                userId: staffId,
            }).unwrap();

            setAlreadyAssigned((prev) =>
                prev.filter((staff) => staff.user !== staffId)
            );

            // dispatch(
            //     showSnack({
            //         message: 'Staff member removed successfully',
            //         color: 'success',
            //     })
            // );
            if (onCallback) onCallback();
            onAssign([]);
        } catch (error) {
            // dispatch(
            //     showSnack({
            //         message: 'Failed to remove staff member',
            //         color: 'error',
            //     })
            // );
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <>
                <LoadingOverlay isVisible={true} />
            </>
        );
    }

    // Error state
    if (isError) {
        return (
            <>
                {isMobile ? (
                    <Sheet open={open} onOpenChange={onClose}>
                        <SheetContent className="p-0 flex flex-col h-dvh">
                            <div className="flex items-center justify-center p-8 text-red-600 flex-col">
                                <Info className="h-12 w-12 mb-2 text-red-500" />
                                <span className="text-center">Error loading staff data</span>
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    className="mt-4"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    <Dialog open={open} onOpenChange={onClose}>
                        <DialogContent className="sm:max-w-[425px]">
                            <div className="flex items-center justify-center p-8 text-red-600">
                                <svg
                                    className="h-6 w-6 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>Error loading staff data</span>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </>
        );
    }

    const remainingStaff = shift.count - assignedStaffIds.length;

    // Mobile empty state
    const renderMobileEmptyState = () => {
        return (
            <div
                className="flex flex-col items-center justify-center h-40 
        border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 mx-3"
            >
                <Users className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                    No staff members found
                </p>
                <p className="text-xs text-gray-400 text-center mt-1 max-w-64 px-4">
                    {searchTerm
                        ? `Try different search terms or filters`
                        : `Try changing your filters or check back later`}
                </p>
            </div>
        );
    };

    // Mobile header
    const renderMobileHeader = () => {
        return (
            <div className="sticky top-0 z-10 bg-white border-b">
                <div className="flex items-center justify-between p-3">
                    <div>
                        <h2 className="text-base font-semibold">Assign Staff</h2>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{moment(shift.date).format('ddd, D MMM')}</span>
                            <span className="mx-1">•</span>
                            <span>{shift.shiftPattern.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-8 w-8 p-0 rounded-full mr-1"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <SheetClose asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </SheetClose>
                    </div>
                </div>

                {/* Availability filter tabs for mobile */}
                <div className="border-t border-b px-3 py-1.5">
                    <Tabs
                        value={currentFilterTab}
                        onValueChange={setCurrentFilterTab}
                        className="w-full"
                    >
                        <TabsList className="grid grid-cols-3 w-full h-8">
                            <TabsTrigger value="all" className="text-xs">
                                All Staff
                            </TabsTrigger>
                            <TabsTrigger value="available" className="text-xs">
                                Available
                            </TabsTrigger>
                            <TabsTrigger value="unavailable" className="text-xs">
                                Unavailable
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
        );
    };

    // Mobile View
    // Mobile View
    if (isMobile) {
        return (
            <>
                <Sheet open={open} onOpenChange={onClose}>
                    <LoadingOverlay isVisible={isRefreshing} />
                    <SheetContent
                        className={cn(
                            'p-0 flex flex-col h-dvh [&>button:last-child]:hidden',
                            isIOS && 'pb-[env(safe-area-inset-bottom)]'
                        )}
                    >
                        <div
                            className={cn(
                                'sticky top-0 z-10 bg-white border-b',
                                isIOS && 'pt-[env(safe-area-inset-top)]',
                                isIOS ? 'h-[calc(auto+env(safe-area-inset-top))]' : 'h-auto'
                            )}
                        >
                            <div className="flex items-center justify-between p-3">
                                <div>
                                    <h2 className="text-base font-semibold">Assign Staff</h2>
                                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <span>{moment(shift.date).format('ddd, D MMM')}</span>
                                        <span className="mx-1">•</span>
                                        <span>{shift.shiftPattern.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefresh}
                                        className="h-8 w-8 p-0 rounded-full mr-1"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                    <SheetClose asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </SheetClose>
                                </div>
                            </div>

                            {/* Availability filter tabs for mobile */}
                            <div className="border-t border-b px-3 py-1.5">
                                <Tabs
                                    value={currentFilterTab}
                                    onValueChange={setCurrentFilterTab}
                                    className="w-full"
                                >
                                    <TabsList className="grid grid-cols-3 w-full h-8">
                                        <TabsTrigger value="all" className="text-xs">
                                            All Staff
                                        </TabsTrigger>
                                        <TabsTrigger value="available" className="text-xs">
                                            Available
                                        </TabsTrigger>
                                        <TabsTrigger value="unavailable" className="text-xs">
                                            Unavailable
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <ScrollArea
                                className={cn(
                                    isIOS
                                        ? 'h-[calc(100vh-180px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]'
                                        : 'h-[calc(100vh-180px)]'
                                )}
                            >
                                <div className="py-3">
                                    <AssignmentSummary
                                        assignedStaff={alreadyAssigned || []}
                                        remainingCount={remainingStaff}
                                        onEditStaff={handleRemoveStaff}
                                        isMobile={true}
                                    />

                                    <div className="px-3">
                                        <SearchAndFilter
                                            searchTerm={searchTerm}
                                            onSearchChange={setSearchTerm}
                                            roleFilter={roleFilter}
                                            onRoleFilterChange={setRoleFilter}
                                            isMobile={true}
                                            showFilters={showFilters}
                                            setShowFilters={setShowFilters}
                                        />
                                    </div>

                                    {filteredStaff.length === 0 ? (
                                        renderMobileEmptyState()
                                    ) : (
                                        <div className="px-3 space-y-2 mb-20">
                                            {filteredStaff.map((staff) => (
                                                <StaffCard
                                                    key={staff.user._id}
                                                    staff={staff}
                                                    isSelected={selectedStaff.includes(staff.user._id)}
                                                    onToggle={() => handleStaffToggle(staff.user._id)}
                                                    disabled={
                                                        !staff.availability.isAvailable ||
                                                        (selectedStaff.length + assignedStaffIds.length >=
                                                            shift.count &&
                                                            !selectedStaff.includes(staff.user._id))
                                                    }
                                                    isMobile={true}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Fixed footer actions */}
                        <div
                            className={cn(
                                'border-t py-3 px-4 bg-white sticky bottom-0 left-0 right-0',
                                isIOS && 'pb-[env(safe-area-inset-bottom)]'
                            )}
                        >
                            {selectedStaff.length > 0 ? (
                                <Button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={selectedStaff.length === 0 || isAssigning}
                                    className="w-full"
                                >
                                    {isAssigning ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Assigning...
                                        </div>
                                    ) : (
                                        `Assign ${selectedStaff.length} Staff`
                                    )}
                                </Button>
                            ) : (
                                <Button onClick={onClose} variant="outline" className="w-full">
                                    Close
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                    <AlertDialogContent className="max-w-[90%]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                                Assign {selectedStaff.length} staff member
                                {selectedStaff.length !== 1 ? 's' : ''} to this shift?
                                {similarShifts.length > 0 && (
                                    <div className="mt-3 p-3 bg-muted rounded-md">
                                        <p className="text-sm font-medium">Similar shifts found</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Would you like to assign these staff members to similar
                                            shifts as well?
                                        </p>
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleAssign(similarShifts.length > 0)}
                            >
                                Confirm Assignment
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    // Desktop View (Original)
    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <LoadingOverlay isVisible={isRefreshing} />
                <DialogContent
                    className="p-0 flex flex-col max-h-[90vh] [&>button:last-child]:hidden sm:max-w-[725px]"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl">Assign Staff</DialogTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {shift.shiftPattern.name} -{' '}
                                    {moment(shift.date).format('MMM D, YYYY')}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleRefresh()}
                                className="h-8 w-8"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto px-6 py-4">
                        <AssignmentSummary
                            assignedStaff={alreadyAssigned || []}
                            remainingCount={remainingStaff}
                            onEditStaff={handleRemoveStaff}
                            isMobile={false}
                        />

                        <SearchAndFilter
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            roleFilter={roleFilter}
                            onRoleFilterChange={setRoleFilter}
                            isMobile={false}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredStaff.map((staff) => (
                                <StaffCard
                                    key={staff.user._id}
                                    staff={staff}
                                    isSelected={selectedStaff.includes(staff.user._id)}
                                    onToggle={() => handleStaffToggle(staff.user._id)}
                                    disabled={
                                        !staff.availability.isAvailable ||
                                        (selectedStaff.length + assignedStaffIds.length >=
                                            shift.count &&
                                            !selectedStaff.includes(staff.user._id))
                                    }
                                    isMobile={false}
                                />
                            ))}
                        </div>

                        {filteredStaff.length === 0 && (
                            <div
                                className="flex flex-col items-center justify-center h-40 
                border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
                            >
                                <svg
                                    className="h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">
                                    No staff members found matching your criteria
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t flex-shrink-0 flex justify-end space-x-3 bg-gray-50">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => setShowConfirmation(true)}
                            disabled={selectedStaff.length === 0 || isAssigning}
                        >
                            {isAssigning ? (
                                <div className="flex items-center">
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Assigning...
                                </div>
                            ) : (
                                `Assign Selected (${selectedStaff.length})`
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Staff Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to assign {selectedStaff.length} staff
                            member{selectedStaff.length !== 1 ? 's' : ''} to this shift?
                            {similarShifts.length > 0 && (
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                    <p className="text-sm font-medium">Similar shifts found</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Would you like to assign these staff members to similar
                                        shifts as well?
                                    </p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleAssign(similarShifts.length > 0)}
                        >
                            Confirm Assignment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AssignStaffDialog;
