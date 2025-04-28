import React, { useState, useEffect } from 'react';
import { QrCodeIcon, X, MapPin, Navigation, Pen, HomeIcon, TimerIcon, Paperclip, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import moment from 'moment';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IShiftAssignment } from '@wyecare-monorepo/shared-types';
import { useDispatch } from 'react-redux';
import ApprovalOptionsDialog from './approval-action';
import { useGetUserTimesheetByShiftIdQuery } from '../../timesheets/timesheetApi';
import { LoadingOverlay } from '@/components/loading-overlay';

interface ShiftViewDialogProps {
    open: boolean;
    onClose: () => void;
    selectedDate: moment.Moment | null;
    selectedShifts: IShiftAssignment[];
    onRequestTimesheet: (shift: IShiftAssignment) => void;
    onRequestAttendance: (shift: IShiftAssignment) => void;
    refetch?: () => void; // Added optional refetch prop
}

const ShiftViewDialog: React.FC<ShiftViewDialogProps> = ({
    open,
    onClose,
    selectedDate,
    selectedShifts,
    onRequestTimesheet,
    onRequestAttendance,
    refetch
}) => {
    const dispatch = useDispatch();
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const isTablet = window.matchMedia('(max-width: 768px)').matches;

    // State for approval options dialog
    const [timesheetOptionsOpen, setTimesheetOptionsOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<IShiftAssignment | null>(null);
    const [processingShiftId, setProcessingShiftId] = useState<string | null>(null);
    const [isLoadingUI, setIsLoadingUI] = useState(false);

    // Local state to track selected shifts
    const [localSelectedShifts, setLocalSelectedShifts] = useState<IShiftAssignment[]>([]);

    // State to store timesheet data
    const [timesheetData, setTimesheetData] = useState<any>(null);

    // Get timesheet data for the selected shift
    const {
        data: fetchedTimesheetData,
        isLoading: timesheetLoading,
        isError: timesheetError,
        refetch: refetchTimesheet
    } = useGetUserTimesheetByShiftIdQuery({
        shiftId: selectedShift?.shift?._id || '',
        userId: selectedShift?.user?._id || ''
    }, {
        // Only run query when there's a selected shift
        skip: !selectedShift?.shift?._id,
        // When the query data changes, update our local state
        onSuccess: (data) => {
            if (data?.success && data?.data) {
                setTimesheetData(data.data);
            }
        }
    });

    // Update timesheet data when query result changes
    useEffect(() => {
        if (fetchedTimesheetData?.success && fetchedTimesheetData?.data) {
            setTimesheetData(fetchedTimesheetData.data);
        }
    }, [fetchedTimesheetData]);

    // Update local shifts when prop changes
    useEffect(() => {
        setLocalSelectedShifts(selectedShifts);
    }, [selectedShifts]);

    // Function to open navigation in device's native maps app
    const openNavigation = (address: any) => {
        if (!address) return;

        // Format the address as a query string
        const addressQuery = [
            address.street,
            address.city,
            address.state,
            address.zipCode,
            address.country || 'UK'
        ].filter(Boolean).join(', ');

        // Detect platform using Capacitor
        const platform = Capacitor.getPlatform();

        if (platform === 'ios') {
            // For iOS, use Apple Maps with the maps:// protocol
            window.open(`maps://?q=${encodeURIComponent(addressQuery)}`, '_system');
        } else {
            // For Android and other platforms, use Google Maps
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`, '_system');
        }
    };

    // Handler for timesheet request button click
    const handleTimesheetRequest = async (shift: IShiftAssignment) => {
        // Start loading UI
        setIsLoadingUI(true);
        setProcessingShiftId(shift._id);
        setSelectedShift(shift);

        try {
            // If we're fetching timesheet data for this shift, wait for it to complete
            if (shift.shift?._id) {
                // Trigger timesheet data fetch if needed
                await refetchTimesheet().unwrap();
            }

            // Show options dialog after we have the latest data
            setTimesheetOptionsOpen(true);
        } catch (error) {
            console.error("Error fetching timesheet data:", error);
        } finally {
            // Allow a small delay for smooth transition
            setTimeout(() => {
                setIsLoadingUI(false);
                setProcessingShiftId(null);
            }, 300);
        }
    };

    // Handler for when a timesheet is approved via signature
    const handleTimesheetApproved = (approvedShift: IShiftAssignment) => {
        // Update the local shifts array with the approved timesheet
        const updatedShifts = localSelectedShifts.map(shift =>
            shift._id === approvedShift._id ? approvedShift : shift
        );

        setLocalSelectedShifts(updatedShifts);

        // Also trigger a refetch if available to ensure backend syncing
        if (refetch) {
            refetch();
        }
    };

    const getTimesheetStatusColor = (status?: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getAssignmentStatusColor = (status?: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'assigned':
                return 'success';
            case 'rejected':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getShiftColor = (shiftName: string): string => {
        let hash = 0;
        for (let i = 0; i < shiftName?.length; i++) {
            hash = shiftName?.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 85%, 55%)`;
    };

    const StatusBadge = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'default' }) => (
        <Badge variant={getTimesheetStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status}
        </Badge>
    );

    const AStatusBadge = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'default' }) => (
        <Badge variant={getAssignmentStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status}
        </Badge>
    );

    const InfoRow = ({ icon: Icon, text, badge }: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className={`flex-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {text}
            </span>
            {badge && badge}
        </div>
    );

    // New component for timesheet options dialog
    const TimesheetOptionsDialog = () => (
        <Dialog open={timesheetOptionsOpen} onOpenChange={() => setTimesheetOptionsOpen(false)}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Choose Timesheet Creation Method
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => {
                            if (selectedShift) {
                                onRequestTimesheet(selectedShift);
                                setTimesheetOptionsOpen(false);
                            }
                        }}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-center p-2">
                                <QrCodeIcon className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                            </div>
                            <CardTitle className="text-center">QR Code</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center text-xs md:text-sm">
                                Generate a QR code for the care home admin to scan and approve
                            </CardDescription>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button variant="secondary" className="w-full">
                                <QrCodeIcon className="mr-2 h-4 w-4" />
                                Use QR Code
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => {
                            if (selectedShift) {
                                // Open the approval options dialog for signature
                                setTimesheetOptionsOpen(false);
                                setTimeout(() => {
                                    // Give time for first dialog to close to avoid stacking
                                    setSelectedShift(selectedShift);
                                    // Now we pass to the ApprovalOptionsDialog to handle signature
                                    const approvalOptionsDialog = document.getElementById('approval-options-dialog');
                                    if (approvalOptionsDialog) {
                                        approvalOptionsDialog.click();
                                    }
                                }, 100);
                            }
                        }}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-center p-2">
                                <Pen className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                            </div>
                            <CardTitle className="text-center">Signature</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-center text-xs md:text-sm">
                                Let the care home admin sign directly on the device screen
                            </CardDescription>
                        </CardContent>
                        <CardFooter className="flex justify-center">
                            <Button variant="secondary" className="w-full">
                                <Pen className="mr-2 h-4 w-4" />
                                Use Signature
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setTimesheetOptionsOpen(false)}
                        className={`${isMobile ? 'w-full' : ''}`}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    // Get the current timesheet status for a shift
    const getTimesheetStatus = (shift: IShiftAssignment) => {
        // If this is the currently selected shift and we have timesheetData
        if (selectedShift && selectedShift._id === shift._id && timesheetData) {
            return timesheetData.status;
        }

        // Otherwise use shift's timesheet status if available
        return shift.timesheet?.status;
    };

    // Determine if a shift has a timesheet
    const hasTimesheet = (shift: IShiftAssignment) => {
        if (selectedShift && selectedShift._id === shift._id && timesheetData) {
            return true;
        }
        return !!shift.timesheet;
    };

    return (
        <>
            {/* Global loading overlay */}
            {isLoadingUI && <LoadingOverlay isVisible={isLoadingUI} message="Processing request..." />}

            <Dialog open={open} onOpenChange={() => onClose()}>
                <DialogContent className="sm:max-w-[768px]">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <DialogTitle className="text-xl font-semibold">
                                    Shifts Overview
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    {selectedDate?.format('dddd, MMMM D, YYYY')}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid gap-4">
                        {localSelectedShifts.map((assignment) => {
                            const currentTimesheetStatus = getTimesheetStatus(assignment);
                            const shiftHasTimesheet = hasTimesheet(assignment);

                            return (
                                <Card key={assignment._id} className="transition-all duration-200 hover:-translate-y-0.5">
                                    <CardContent className="p-6">
                                        <div className="grid gap-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12" style={{ backgroundColor: getShiftColor(assignment.shift?.shiftPattern?.name) }}>
                                                    <AvatarFallback className="font-semibold">
                                                        {assignment.shift?.shiftPattern?.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold mb-2">
                                                        {assignment.shift?.shiftPattern?.name}
                                                    </h3>

                                                    <AStatusBadge status={assignment?.status} size={isMobile ? 'sm' : 'default'} />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <InfoRow
                                                        icon={HomeIcon}
                                                        text={assignment.shift?.homeId?.name}
                                                    />
                                                    {/* Show Address Info */}
                                                    {assignment.shift?.homeId?.address && (
                                                        <div className="pl-6 text-sm text-muted-foreground space-y-1">
                                                            <p>{assignment.shift.homeId.address.street}</p>
                                                            <p>{assignment.shift.homeId.address.city}, {assignment.shift.homeId.address.zipCode}</p>
                                                        </div>
                                                    )}
                                                    <InfoRow
                                                        icon={TimerIcon}
                                                        text={`${assignment.shift?.shiftPattern?.timings?.find(
                                                            (timing) => timing.careHomeId === assignment.shift?.homeId?._id
                                                        )?.startTime} - ${assignment.shift?.shiftPattern?.timings?.find(
                                                            (timing) => timing.careHomeId === assignment.shift?.homeId?._id
                                                        )?.endTime}`}
                                                    />
                                                    {shiftHasTimesheet && (
                                                        <InfoRow
                                                            icon={Paperclip}
                                                            text="Timesheet Status:"
                                                            badge={
                                                                <StatusBadge
                                                                    status={currentTimesheetStatus}
                                                                    size={isMobile ? 'sm' : 'default'}
                                                                />
                                                            }
                                                        />
                                                    )}
                                                </div>

                                                <div className={`flex ${isTablet ? 'flex-col' : 'justify-end'} gap-2`}>
                                                    <Button
                                                        variant='default'
                                                        className="w-full md:w-auto"
                                                        disabled={currentTimesheetStatus === 'approved' || processingShiftId === assignment._id}
                                                        onClick={() => handleTimesheetRequest(assignment)}
                                                    >
                                                        <QrCodeIcon className="mr-2 h-4 w-4" />
                                                        {processingShiftId === assignment._id
                                                            ? 'Processing...'
                                                            : currentTimesheetStatus === 'approved'
                                                                ? 'Timesheet Approved'
                                                                : currentTimesheetStatus === 'pending'
                                                                    ? 'Update Timesheet'
                                                                    : 'Request Timesheet'}
                                                    </Button>

                                                    {/* Navigation Button */}
                                                    {assignment.shift?.homeId?.address && (
                                                        <Button
                                                            variant='outline'
                                                            className="w-full md:w-auto"
                                                            onClick={() => openNavigation(assignment.shift?.homeId?.address)}
                                                        >
                                                            <Navigation className="mr-2 h-4 w-4" />
                                                            Open in Maps
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className={`${isMobile ? 'w-full' : ''}`}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Options dialog for choosing between QR code and signature */}
            <TimesheetOptionsDialog />

            {/* Hidden button to trigger the approval options dialog for signature */}
            <span id="approval-options-dialog" className="hidden" />

            {/* ApprovalOptionsDialog for the signature flow */}
            <ApprovalOptionsDialog
                open={false} // We'll control this dialog programmatically
                onClose={() => setSelectedShift(null)}
                shift={selectedShift}
                timesheetData={timesheetData} // Pass the fetched timesheet data
                onRequestQRCode={onRequestTimesheet}
                onTimesheetApproved={handleTimesheetApproved} // Pass the new callback
            />
        </>
    );
};

export default ShiftViewDialog;