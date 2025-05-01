import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    AlertTriangle, Building, Calendar, Check, Clock, Coins,
    Eye, Filter, MoreHorizontal, Plus, Settings, Users, X, Medal, AlertCircle, Heart,
    User, ChevronDown,
    RotateCcw,
    LoaderCircle,
    Search
} from 'lucide-react';
import moment from 'moment';
import AssignStaffDialog from '../components/assign-staff';
import ViewAssignedStaffDialog from './assigned-staff';
import DeleteConfirmationDialog from '@/components/delete-confirmation';
import ShiftDetailsModal from './shift-detail'; // Import the new modal component

// Shadcn UI components
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { IShift } from '@wyecare-monorepo/shared-types';
import { useMediaQuery } from '@/app/layouts/hook/media-query';
import { selectCurrentOrganization, selectUser } from '../../auth/AuthSlice';
import { useAcceptShiftByAgencyMutation, useApproveUnauthorizedShiftMutation, useDeleteShiftMutation, useGetShiftsForaDayQuery } from '../shiftApi';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '@/components/loading-overlay';

interface ViewShiftDialogProps {
    open: boolean;
    onClose: () => void;
    selectedDate: moment.Moment | null;
    shifts: IShift[];
    onShiftsUpdate: (updatedShifts: IShift[]) => void;
    onEditClick: (shift: IShift) => void;
    onAddFurther: () => void;
}

/**
 * Custom hook for responsive designs
 */
const useResponsiveDialog = () => {
    const {
        isTablet,
        isMobile
    } = useMediaQuery();

    return {
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet
    };
};

const ViewShiftDialog: React.FC<ViewShiftDialogProps> = ({
    open,
    onClose,
    selectedDate,
    shifts,
    onShiftsUpdate,
    onEditClick,
    onAddFurther
}) => {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization)
    const isAgency = currentOrganization?.type === 'agency'
    const isHome = currentOrganization?.type === 'home';
    const { isMobile, isTablet } = useResponsiveDialog();

    const [assignStaffDialogOpen, setAssignStaffDialogOpen] = useState(false);
    const [viewAssignedStaffDialogOpen, setViewAssignedStaffDialogOpen] = useState(false);
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState<IShift | null>(null);
    const [selectedShift, setSelectedShift] = useState<IShift | null>(null);
    const [detailsModalShift, setDetailsModalShift] = useState<IShift | null>(null);
    const [assignedStaffs, setAssignedStaffs] = useState<any[] | null>(null);
    const [acceptShiftByAgency] = useAcceptShiftByAgencyMutation();
    const [deleteShift] = useDeleteShiftMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showSearchBar, setShowSearchBar] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        data: shiftsData,
        isLoading,
        refetch: refetchShifts
    } = useGetShiftsForaDayQuery(selectedDate?.format('YYYY-MM-DD') || '', {
        refetchOnMountOrArgChange: true,
        skip: !selectedDate || !open
    });

    const [approveUnauthorizedShift, { isLoading: isApprovingShift }] = useApproveUnauthorizedShiftMutation();

    const handleApproveBooking = async (shift: IShift) => {
        try {
            await approveUnauthorizedShift({
                shiftId: shift._id,
                action: 'approved'
            }).unwrap();

            toast.success('Booking approved')
            refetchShifts();
        } catch (error) {
            // dispatch(showSnack({
            //     message: 'Failed to approve shift booking. Please try again.',
            //     color: 'error'
            // }));
            toast.error('Failed to approve shift booking. Please try again.')
        }
    };

    const handleRejectBooking = async (shift: IShift) => {
        try {
            await approveUnauthorizedShift({
                shiftId: shift._id,
                action: 'rejected'
            }).unwrap();

            toast.success('Rejected')
            refetchShifts();
        } catch (error) {
            toast.error('Rejection error')
        }
    };

    const handleOpenAssignStaff = (shift: IShift) => {
        setSelectedShift(shift);
        setAssignStaffDialogOpen(true);
    };

    const handleOpenViewAssignedStaff = (shift: IShift) => {
        setSelectedShift(shift);
        setViewAssignedStaffDialogOpen(true);
    };

    const handleOpenDetailsModal = (shift: IShift) => {
        setDetailsModalShift(shift);
    };

    const handleCloseDetailsModal = () => {
        setDetailsModalShift(null);
    };

    const handleDeleteShift = async () => {
        try {
            await deleteShift(shiftToDelete?._id as string).unwrap();
            setOpenDeleteConfirmation(false);
            dispatch(showSnack({ message: 'Shift deleted successfully', color: 'success' }));
        } catch (error) {
            dispatch(showSnack({
                message: 'Failed to delete shift. Please try again.',
                color: 'error'
            }));
        }
    };

    const handleAcceptShift = async (shift: IShift) => {
        try {
            const updatedShift = await acceptShiftByAgency(shift._id).unwrap();
            dispatch(showSnack({ message: 'Shift accepted successfully', color: 'success' }));
        } catch (error: any) {
            if (error.status === 402) {
                // dispatch(openPaymentDialog(error.data?.message || 'Please subscribe to accept the shift'));
            }
            dispatch(showSnack({
                message: 'Failed to accept shift. Please try again.',
                color: 'error'
            }));
        }
    };

    if (!open) return null;

    if (isLoading) {
        return <LoadingOverlay isVisible={isLoading} />
    }

    const filteredShifts = shiftsData
        ?.filter(shift => shift.shiftPattern?.name.toLowerCase().includes(searchTerm.toLowerCase()))
        ?.filter(shift => {
            if (filterType === 'all') return true;
            if (filterType === 'emergency') return shift.isEmergency;
            if (filterType === 'unassigned') return shift.assignedUsers?.length === 0;
            if (filterType === 'assigned') return shift.assignedUsers?.length > 0;
            return true;
        });

    // Decide whether to use Dialog or Sheet based on screen size
    const ResponsiveContainer = isMobile ? Sheet : Dialog;
    const ResponsiveHeader = isMobile ? SheetHeader : DialogHeader;
    const ResponsiveTitle = isMobile ? SheetTitle : DialogTitle;
    const ResponsiveContent = isMobile ? SheetContent : DialogContent;
    const ResponsiveFooter = isMobile ? SheetFooter : DialogFooter;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetchShifts();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Render filters section
    const renderFilters = () => {
        return (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 justify-between items-start sm:items-center p-4 border-b">
                <div className="w-full sm:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                        type="text"
                        placeholder="Search by shift pattern..."
                        className="w-full sm:max-w-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() => setFilterType('all')}
                                className={filterType === 'all' ? 'bg-muted' : ''}
                            >
                                All Shifts
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType('emergency')}
                                className={filterType === 'emergency' ? 'bg-muted' : ''}
                            >
                                Emergency Only
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType('unassigned')}
                                className={filterType === 'unassigned' ? 'bg-muted' : ''}
                            >
                                Unassigned
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setFilterType('assigned')}
                                className={filterType === 'assigned' ? 'bg-muted' : ''}
                            >
                                Assigned
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant='ghost'
                        onClick={handleRefresh}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                    </Button>
                </div>

                {(isHome || isAgency) && (
                    <Button onClick={onAddFurther} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shift
                    </Button>
                )}
            </div>
        );
    };

    // Mobile optimized filters with tabs
    const renderMobileFilters = () => {
        return (
            <div className="sticky top-[52px] bg-white z-10 border-b">
                <div className="px-3 py-2">
                    <Tabs
                        defaultValue={filterType}
                        className="w-full"
                        value={filterType}
                        onValueChange={setFilterType}
                    >
                        <TabsList className="grid grid-cols-4 w-full h-9">
                            <TabsTrigger value="all" className="text-xs px-1">All</TabsTrigger>
                            <TabsTrigger value="emergency" className="text-xs px-1">Emergency</TabsTrigger>
                            <TabsTrigger value="unassigned" className="text-xs px-1">Unassigned</TabsTrigger>
                            <TabsTrigger value="assigned" className="text-xs px-1">Assigned</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
        );
    };


    // Render status badge with hover tooltip for detailed info
    const renderStatus = (shift: any) => {
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        let status = '';
        let variant: "default" | "destructive" | "outline" | "secondary" | "success" | "warning" = "default";
        let tooltipText = '';

        if (shift.needsApproval && !shift.isTemporaryHome) {
            switch (shift.bookingStatus) {
                case 'approved':
                    status = 'Booking Approved';
                    variant = "success";
                    tooltipText = 'This agency booking has been approved';
                    break;
                case 'rejected':
                    status = 'Booking Rejected';
                    variant = "destructive";
                    tooltipText = 'This agency booking has been rejected';
                    break;
                default:
                    status = 'Pending Approval';
                    variant = "warning";
                    tooltipText = 'This is a booking request that needs approval, but still can assign your staffs';
            }

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge
                                variant={variant}
                                className={shift.bookingStatus === 'approved' ? 'bg-green-500' :
                                    shift.bookingStatus === 'rejected' ? 'bg-red-500' :
                                        'bg-amber-500'}
                            >
                                {status}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tooltipText}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }

        if (shift.isDone) {
            status = 'Completed';
            variant = "success";
            tooltipText = 'This shift has been completed';
        } else if (shift.isCompleted) {
            status = 'Assigned';
            variant = "secondary";
            tooltipText = 'This shift has been assigned';
        } else if (assignedStaffCount >= shift.count) {
            status = 'Fully Staffed';
            variant = "default";
            tooltipText = `All ${shift.count} positions filled`;
        } else if (assignedStaffCount > 0) {
            status = 'Partially Staffed';
            variant = "warning";
            tooltipText = `${assignedStaffCount}/${shift.count} positions filled`;
        } else {
            status = 'Unassigned';
            variant = "outline";
            tooltipText = 'No staff assigned yet';
        }

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Badge variant={variant}>{status}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const renderMobileShiftCard = (shift) => {
        const timing = shift?.shiftPattern?.timings?.find(
            timing => timing.careHomeId === shift?.homeId?._id
        );
        const companyName = isAgency ? shift?.homeId?.name : shift?.agentId?.name;
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        // Find the appropriate rate
        const rate = shift.shiftPattern?.rates?.find(r =>
            r.careHomeId === shift?.homeId?._id && r.userType === "Carer"
        );

        return (
            <Card
                key={shift._id}
                className={`mb-2 shadow-sm border overflow-hidden ${shift.isEmergency ? 'border-red-400' : ''
                    } ${shift.needsApproval ? 'border-amber-300' : ''
                    }`}
            >
                {/* Status strip at the top */}
                {shift.isEmergency && (
                    <div className="h-1 w-full bg-red-400"></div>
                )}

                <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center">
                                {shift.isEmergency && (
                                    <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                                )}
                                <CardTitle className="text-sm font-medium truncate max-w-[200px]">
                                    {shift.shiftPattern?.name}
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs mt-0.5 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {moment(shift.date).format('ddd, D MMM')}
                                <Separator orientation="vertical" className="mx-1.5 h-3" />
                                <Clock className="h-3 w-3 mr-1" />
                                {timing?.startTime} - {timing?.endTime}
                            </CardDescription>
                        </div>
                        {renderMobileStatus(shift)}
                    </div>
                </CardHeader>

                <CardContent className="py-1.5 px-3">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
                        <div className="flex items-center text-muted-foreground">
                            <Building className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{companyName || 'Internal'}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                            <Users className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span className="font-medium">{assignedStaffCount}</span>
                            <span className="text-muted-foreground">/{shift.count}</span>
                        </div>
                        {rate && (
                            <div className="flex items-center text-muted-foreground">
                                <Coins className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span>£{shift.isEmergency ? rate.emergencyWeekdayRate : rate.weekdayRate}/hr</span>
                            </div>
                        )}
                        {shift.isTemporaryHome && (
                            <div className="flex items-center">
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 h-5 px-1.5">
                                    Temporary
                                </Badge>
                            </div>
                        )}
                    </div>

                    {shift.needsApproval && (
                        <div className="text-xs text-amber-600 mt-2 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            {shift.bookingStatus !== 'approved' && shift.bookingStatus !== 'rejected' ?
                                'Needs approval' :
                                `Booking ${shift.bookingStatus}`
                            }
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0 pb-2.5 px-3">
                    {/* Home users with shifts needing approval */}
                    {isHome && shift.needsApproval && shift.bookingStatus !== 'approved' && shift.bookingStatus !== 'rejected' ? (
                        <div className="flex justify-between gap-2 w-full">
                            <Button
                                onClick={() => handleApproveBooking(shift)}
                                variant="default"
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
                            >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                            </Button>
                            <Button
                                onClick={() => handleRejectBooking(shift)}
                                variant="destructive"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-between w-full items-center">
                            {/* Shift details button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetailsModal(shift)}
                                className="h-8 text-xs p-2"
                            >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Details
                            </Button>

                            {/* Main action buttons */}
                            <div className="flex space-x-1">
                                {!shift.isDone && isAgency && shift.agencyAccepted && assignedStaffCount < shift.count && (
                                    <Button
                                        onClick={() => handleOpenAssignStaff(shift)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 px-2"
                                    >
                                        <Users className="h-3.5 w-3.5 mr-1" />
                                        Assign
                                    </Button>
                                )}

                                {!shift.isDone && isHome && (!shift.agentId?._id) && (
                                    <Button
                                        onClick={() => handleOpenAssignStaff(shift)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 px-2"
                                    >
                                        <Users className="h-3.5 w-3.5 mr-1" />
                                        Assign
                                    </Button>
                                )}

                                {assignedStaffCount > 0 && (
                                    <Button
                                        onClick={() => handleOpenViewAssignedStaff(shift)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs px-2"
                                    >
                                        <User className="h-3.5 w-3.5 mr-1" />
                                        Staff
                                    </Button>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {!shift.isDone && (
                                            <>


                                                {isAgency && (shift.bookingStatus !== 'rejected') && (
                                                    <>
                                                        {!shift.agencyAccepted && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleAcceptShift(shift)}
                                                                className="text-green-600 text-xs"
                                                            >
                                                                <Check className="h-3.5 w-3.5 mr-2" />
                                                                Accept Shift
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuItem
                                                            onClick={() => onEditClick(shift)}
                                                            className="text-xs"
                                                        >
                                                            <Settings className="h-3.5 w-3.5 mr-2" />
                                                            Edit Shift
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {isHome && !shift.isDone && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => onEditClick(shift)}
                                                            className="text-xs"
                                                        >
                                                            <Settings className="h-3.5 w-3.5 mr-2" />
                                                            Edit Shift
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setShiftToDelete(shift);
                                                                setOpenDeleteConfirmation(true);
                                                            }}
                                                            className="text-red-600 text-xs"
                                                        >
                                                            <X className="h-3.5 w-3.5 mr-2" />
                                                            Delete Shift
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                {isAgency && (shift.needsApproval || shift.isTemporaryHome) && !shift.isDone && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setShiftToDelete(shift);
                                                            setOpenDeleteConfirmation(true);
                                                        }}
                                                        className="text-red-600 text-xs"
                                                    >
                                                        <X className="h-3.5 w-3.5 mr-2" />
                                                        Delete Booking
                                                    </DropdownMenuItem>
                                                )}
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    };
    const renderMobileStatus = (shift) => {
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        if (shift.needsApproval && !shift.isTemporaryHome) {
            switch (shift.bookingStatus) {
                case 'approved':
                    return (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Approved
                        </Badge>
                    );
                case 'rejected':
                    return (
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                            <X className="h-3 w-3 mr-1" />
                            Rejected
                        </Badge>
                    );
                default:
                    return (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                        </Badge>
                    );
            }
        }

        if (shift.isDone) {
            return (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Done
                </Badge>
            );
        } else if (shift.isCompleted) {
            return (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Assigned
                </Badge>
            );
        } else if (assignedStaffCount >= shift.count) {
            return (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Full
                </Badge>
            );
        } else if (assignedStaffCount > 0) {
            return (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {assignedStaffCount}/{shift.count}
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Open
                </Badge>
            );
        }
    };


    // Render shift actions menu
    const renderShiftActions = (shift: any) => {
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        // For home users with shifts needing approval
        if (isHome && shift.needsApproval && shift.bookingStatus !== 'approved' && shift.bookingStatus !== 'rejected') {
            return (
                <div className="flex items-center justify-end space-x-1">
                    <Button
                        onClick={() => handleApproveBooking(shift)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-transparent text-green-600"
                        title="Approve Booking"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => handleRejectBooking(shift)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-transparent text-red-600"
                        title="Reject Booking"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-end space-x-1">
                {!shift.isDone && (
                    <>
                        {isAgency && (shift.needsApproval || shift.isTemporaryHome) && !shift.isDone && (
                            <Button
                                onClick={() => {
                                    setShiftToDelete(shift);
                                    setOpenDeleteConfirmation(true);
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full border border-transparent text-red-600 hover:bg-red-100"
                                title="Delete Booking"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        {isAgency && (shift.bookingStatus !== 'rejected') && (
                            <>
                                {!shift.agencyAccepted && (
                                    <Button
                                        onClick={() => handleAcceptShift(shift)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border border-transparent text-green-600"
                                        title="Accept Shift"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                                {shift.agencyAccepted && (
                                    <Button
                                        onClick={() => handleOpenAssignStaff(shift)}
                                        disabled={assignedStaffCount >= shift.count}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border border-transparent disabled:opacity-50"
                                        title="Assign Staff"
                                    >
                                        <Users className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    onClick={() => onEditClick(shift)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border border-transparent hover:border-gray-200 text-gray-600"
                                    title="Edit Shift"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </>
                        )}

                        {isHome && (
                            <>

                                {!shift?.agentId?._id && (
                                    <Button
                                        onClick={() => handleOpenAssignStaff(shift)}
                                        disabled={assignedStaffCount >= shift.count}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border border-transparent hover:border-blue-200 text-blue-600 disabled:opacity-50"
                                        title="Assign Staff"
                                    >
                                        <Users className="h-4 w-4" />
                                    </Button>
                                )}

                                {!shift.isDone && (
                                    <>
                                        <Button
                                            onClick={() => onEditClick(shift)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full border border-transparent text-gray-600"
                                            title="Edit Shift"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShiftToDelete(shift);
                                                setOpenDeleteConfirmation(true);
                                            }}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full border border-transparent text-red-600"
                                            title="Delete Shift"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}

                {assignedStaffCount > 0 && (
                    <Button
                        onClick={() => handleOpenViewAssignedStaff(shift)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full border border-transparent text-blue-600"
                        title="View Assigned Staff"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    };

    // Mobile-optimized action buttons
    const renderMobileActions = (shift: any) => {
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        // For home users with shifts needing approval
        if (isHome && shift.needsApproval && shift.bookingStatus !== 'approved' && shift.bookingStatus !== 'rejected') {
            return (
                <div className="flex justify-between gap-2 mt-2">
                    <Button
                        onClick={() => handleApproveBooking(shift)}
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                    </Button>
                    <Button
                        onClick={() => handleRejectBooking(shift)}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                    </Button>
                </div>
            );
        }

        // Main actions dropdown for mobile
        return (
            <div className="mt-2 w-fit">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                            Actions
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 ml-2">
                        {!shift.isDone && (
                            <>


                                {isAgency && (shift.bookingStatus !== 'rejected') && (
                                    <>
                                        {!shift.agencyAccepted && (
                                            <DropdownMenuItem onClick={() => handleAcceptShift(shift)} className="text-green-600">
                                                <Check className="h-4 w-4 mr-2" />
                                                Accept Shift
                                            </DropdownMenuItem>
                                        )}

                                        {shift.agencyAccepted && (
                                            <DropdownMenuItem
                                                onClick={() => handleOpenAssignStaff(shift)}
                                                disabled={assignedStaffCount >= shift.count}
                                            >
                                                <Users className="h-4 w-4 mr-2" />
                                                Assign Staff
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem onClick={() => onEditClick(shift)}>
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Shift
                                        </DropdownMenuItem>
                                    </>
                                )}

                                {isHome && (
                                    <>

                                        {!shift.isDone && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => handleOpenAssignStaff(shift)}
                                                    disabled={assignedStaffCount >= shift.count}
                                                    className="text-blue-600"
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Assign Staff
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => onEditClick(shift)}>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Edit Shift
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setShiftToDelete(shift);
                                                setOpenDeleteConfirmation(true);
                                            }}
                                            className="text-red-600"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Delete Shift
                                        </DropdownMenuItem>
                                    </>
                                )}

                            </>
                        )}

                        {assignedStaffCount > 0 && (
                            <DropdownMenuItem
                                onClick={() => handleOpenViewAssignedStaff(shift)}
                                className="text-blue-600"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View Assigned Staff
                            </DropdownMenuItem>
                        )}

                        {/* View Details option for all shifts */}
                        <DropdownMenuItem onClick={() => handleOpenDetailsModal(shift)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                        </DropdownMenuItem>
                        {isAgency && (shift.needsApproval || shift.isTemporaryHome) && !shift.isDone && (
                            <DropdownMenuItem
                                onClick={() => {
                                    setShiftToDelete(shift);
                                    setOpenDeleteConfirmation(true);
                                }}
                                className="text-red-600"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Delete Booking
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    };

    // Card View for shifts - optimized for mobile and desktop
    const renderShiftCard = (shift: any) => {
        const timing = shift?.shiftPattern?.timings?.find(
            timing => timing.careHomeId === shift?.homeId?._id
        );
        const companyName = isAgency ? shift?.homeId?.name : shift?.agentId?.name;
        console.log('shift andi', shift);
        const assignedStaffCount = shift.assignedUsers?.length || 0;

        // Find the appropriate rate based on user type (Carer as default)
        const rate = shift.shiftPattern?.rates?.find(r =>
            r.careHomeId === shift?.homeId?._id && r.userType === "Carer"
        );

        // Mobile optimized card
        if (isMobile) {
            return (
                <Card
                    key={shift._id}
                    className={`mb-3 shadow-sm ${shift.isEmergency ? 'border-red-400 border-l-4' : ''} ${shift.needsApproval ? 'border-amber-300 border-2' : ''}`}
                >
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base flex items-center">
                                    {shift.isEmergency && (
                                        <Badge variant="destructive" className="mr-2 text-xs">!</Badge>
                                    )}
                                    {shift.shiftPattern?.name}
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">
                                    {moment(shift.date).format('ddd, D MMM')} • {timing?.startTime} - {timing?.endTime}
                                </CardDescription>
                            </div>
                            {renderMobileStatus(shift)}
                        </div>
                    </CardHeader>

                    <CardContent className="py-1 px-4">
                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <Building className="h-3.5 w-3.5 mr-1.5" />
                                <span className="truncate text-xs">{companyName || 'Internal'}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                <span className="text-xs">{assignedStaffCount}/{shift.count} staff</span>
                            </div>
                            {rate && (
                                <div className="flex items-center text-muted-foreground">
                                    <Coins className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="text-xs">£{shift.isEmergency ? rate.emergencyWeekdayRate : rate.weekdayRate}/hr</span>
                                </div>
                            )}
                            {shift.isTemporaryHome && (
                                <div className="flex items-center">
                                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 h-5">
                                        Temporary
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {shift.needsApproval && (
                            <div className="text-xs text-amber-600 mt-2 flex items-center">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                                {shift.bookingStatus !== 'approved' && shift.bookingStatus !== 'rejected' ?
                                    'Needs approval' :
                                    `Booking ${shift.bookingStatus}`
                                }
                            </div>
                        )}

                        {renderMobileActions(shift)}
                    </CardContent>
                </Card>
            );
        }

        // Desktop card (original)
        return (
            <Card
                key={shift._id}
                className={`h-full flex flex-col shadow-lg relative ${shift.isEmergency ? '' : 'bg-gray-50'} ${shift.needsApproval ? 'border-amber-300 border-2' : ''}`}
            >
                <CardHeader className="pb-2 pt-6">  {/* Added extra padding at top to make room for badge */}
                    {shift.isTemporaryHome && (
                        <div className="absolute top-0 left-0 m-2">
                            <Badge variant="outline" className="border-amber-300 text-amber-600">
                                Temporary
                            </Badge>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <div className="flex items-center">
                            {shift.isEmergency && (
                                <Badge variant="destructive" className="mr-2">Emergency</Badge>
                            )}
                            <CardTitle className="text-lg">
                                {shift.shiftPattern?.name}
                            </CardTitle>
                        </div>
                        {renderStatus(shift)}
                    </div>
                    <CardDescription>
                        {moment(shift.date).format('ddd, MMM D, YYYY')}
                        {shift.needsApproval && (
                            <span className="text-amber-600 block mt-1">
                                Requested by {shift.agentId?.name || 'Agency'}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-2 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <Building className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm truncate">{companyName || 'Internal'}</span>
                        </div>
                        <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm whitespace-nowrap">{timing?.startTime} - {timing?.endTime}</span>
                        </div>
                        <div className="flex items-center">
                            <Users className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-sm">
                                <span className="font-medium">{assignedStaffCount}</span>
                                <span className="text-muted-foreground">/{shift.count}</span> staff needed
                            </span>
                        </div>
                        {rate && (
                            <div className="flex items-center">
                                <Coins className="h-4 w-4 text-muted-foreground mr-2" />
                                <span className="text-sm">
                                    £{shift.isEmergency
                                        ? rate.emergencyWeekdayRate
                                        : rate.weekdayRate}/hr
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Check if shift has additional details */}
                    {(shift.genderPreference?.male > 0 ||
                        shift.genderPreference?.female > 0 ||
                        shift.nursePreference?.count > 0 ||
                        shift.preferredStaff?.length > 0 ||
                        shift.notes) && (
                            <Button
                                variant="default"
                                className="w-full mt-3 text-sm h-8"
                                onClick={() => handleOpenDetailsModal(shift)}
                            >
                                More Details
                            </Button>
                        )}
                </CardContent>
                <CardFooter className="flex justify-end pt-0 mt-auto">
                    {renderShiftActions(shift)}
                </CardFooter>
            </Card>
        );
    };

    // Render empty state
    const renderEmptyState = () => {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No shifts found</h3>
                <p className="text-muted-foreground text-center">
                    {searchTerm ?
                        `No shifts matching "${searchTerm}"` :
                        `No ${filterType !== 'all' ? filterType : ''} shifts for this date`
                    }
                </p>
                {isHome && (
                    <Button onClick={onAddFurther} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shift
                    </Button>
                )}
            </div>
        );
    };
    const renderMobileEmptyState = () => {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-base font-medium">No shifts found</h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                    {searchTerm ?
                        `No shifts matching "${searchTerm}"` :
                        `No ${filterType !== 'all' ? filterType : ''} shifts for ${selectedDate?.format('MMMM D')}`
                    }
                </p>
                {filterType !== 'all' || searchTerm ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setFilterType('all');
                            setSearchTerm('');
                        }}
                        className="mb-2"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Clear filters
                    </Button>
                ) : null}
                {isHome && (
                    <Button onClick={onAddFurther} size="sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add new shift
                    </Button>
                )}
            </div>
        );
    };

    const renderMobileHeader = () => {
        return (
            <div className="sticky top-0 bg-white border-b z-10">
                <div className="flex items-center justify-between p-3">
                    <div className="flex items-center">
                        <SheetClose asChild>
                            <Button variant="ghost" size="sm" className="mr-2 h-8 w-8 rounded-full">
                                <X className="h-5 w-5" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </SheetClose>
                        <div>
                            <h2 className="text-base font-semibold">
                                {selectedDate?.format('ddd, MMM D')} Shifts
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSearchBar(!showSearchBar)}
                            className="h-8 w-8 rounded-full"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-8 w-8 rounded-full"
                            aria-label="Refresh"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>

                        {(isHome || isAgency) && (
                            <Button
                                onClick={onAddFurther}
                                size="sm"
                                className="rounded-full flex items-center justify-center h-8 w-8 bg-primary"
                                aria-label="Add Shift"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Collapsible search bar */}
                {showSearchBar && (
                    <div className="px-3 pb-2 flex items-center">
                        <Input
                            type="text"
                            placeholder="Search shifts..."
                            className="text-sm h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchTerm('')}
                                className="h-8 w-8 ml-1 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    };


    return (
        <ResponsiveContainer
            open={open}
            onOpenChange={onClose}
        >
            <ResponsiveContent
                className={isMobile
                    ? "px-0 pt-0 pb-0 h-[90vh] overflow-hidden [&>button]:hidden"
                    : "max-w-7xl w-full flex flex-col h-[90vh] z-50"
                }
                side={isMobile ? "bottom" : undefined}
            >
                {isMobile ? (
                    // Mobile optimized layout
                    <>
                        {renderMobileHeader()}
                        {renderMobileFilters()}

                        <ScrollArea className="flex-1 h-[calc(90vh-160px)]">
                            <div className="p-3">
                                {!filteredShifts || filteredShifts.length === 0 ? (
                                    renderMobileEmptyState()
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {filteredShifts.map(shift => renderMobileShiftCard(shift))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    // Desktop layout (original)
                    <>
                        <ResponsiveHeader className="border-b pb-3">
                            <ResponsiveTitle className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-primary" />
                                Shifts for {selectedDate?.format('MMMM D, YYYY')}
                            </ResponsiveTitle>
                        </ResponsiveHeader>

                        {renderFilters()}

                        <ScrollArea className="max-h-[90vh] overflow-y-auto">
                            <div className="p-4">
                                {!filteredShifts || filteredShifts.length === 0 ? (
                                    renderEmptyState()
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto">
                                        {filteredShifts.map(shift => renderShiftCard(shift))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                )}
                <LoadingOverlay isVisible={isRefreshing} />
            </ResponsiveContent>

            {/* Shift Details Modal */}
            <ShiftDetailsModal
                open={!!detailsModalShift}
                onClose={handleCloseDetailsModal}
                shift={detailsModalShift}
            />

            {/* Nested Dialogs */}
            {selectedShift && (
                <AssignStaffDialog
                    open={assignStaffDialogOpen}
                    onClose={() => {
                        setAssignStaffDialogOpen(false);
                        setSelectedShift(null);
                    }}
                    shift={selectedShift}
                    onAssign={async (assignedShifts: any[]) => {
                        const assignedShiftsMap = new Map(
                            assignedShifts.map((shift) => [shift._id, shift])
                        );
                    }}
                />
            )}

            {viewAssignedStaffDialogOpen && selectedShift && (
                <ViewAssignedStaffDialog
                    open={viewAssignedStaffDialogOpen}
                    onClose={() => {
                        setViewAssignedStaffDialogOpen(false);
                        setSelectedShift(null);
                    }}
                    isInternal={
                        selectedShift.agentId?._id === useState.currentOrganization?._id ||
                        !selectedShift.agentId?._id
                    }
                    shift={selectedShift}
                />
            )}

            <DeleteConfirmationDialog
                open={openDeleteConfirmation}
                onClose={() => setOpenDeleteConfirmation(false)}
                onConfirm={handleDeleteShift}
                itemName="shift"
            />
        </ResponsiveContainer>
    );
};

export default ViewShiftDialog;

function showSnack(arg0: { message: string; color: string; }): any {
    throw new Error('Function not implemented.');
}
