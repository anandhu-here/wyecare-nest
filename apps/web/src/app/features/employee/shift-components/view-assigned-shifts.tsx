import React, { useState, useEffect } from 'react';
import {
    QrCodeIcon,
    Navigation,
    HomeIcon,
    TimerIcon,
    Paperclip,
    Loader2,
    X,
    MapPinIcon,
    Building2,
    User,
    CalendarClock,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    ClockIcon,
    ChevronDown,
    Calendar
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import moment from 'moment';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { LoadingOverlay } from '@/components/loading-overlay';
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import TimesheetStepperFlow from './timesheet-stepper';
import { useGetUserTimesheetByShiftIdQuery } from '../../timesheets/timesheetApi';

/**
 * ShiftViewDialog - Shows shift details and provides access to timesheet approval
 * Redesigned for a more modern and professional look
 */
const ShiftViewDialog = ({
    open,
    onClose,
    selectedDate,
    selectedShifts,
    refetch
}: {
    open: boolean;
    onClose: () => void;
    selectedDate: moment.Moment | null;
    selectedShifts: any[]; // Replace with appropriate type
    refetch: () => void;
}) => {
    // State
    const [isTimesheetStepperOpen, setIsTimesheetStepperOpen] = useState(false);
    const [processingShiftId, setProcessingShiftId] = useState<string | null>(null);
    const [isLoadingUI, setIsLoadingUI] = useState(false);
    const [timesheetDataMap, setTimesheetDataMap] = useState<Record<string, any>>({});
    const [selectedShift, setSelectedShift] = useState<any | null>(null);
    const [expandedAddress, setExpandedAddress] = useState<Record<string, boolean>>({});

    // UI responsive detection
    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
    const isTablet = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false;

    const {
        data: timesheetData,
        isLoading: isTimesheetLoading,
        error: timesheetError
    } = useGetUserTimesheetByShiftIdQuery(
        {
            shiftId: selectedShift?.shift?._id || '',
            userId: selectedShift?.user?._id || ''
        },
        {
            skip: !selectedShift?.shift?._id || !selectedShift?.user?._id,
            refetchOnMountOrArgChange: true
        }
    );


    useEffect(() => {
        if (timesheetData?.success && timesheetData?.data && selectedShift) {
            setTimesheetDataMap(prev => ({
                ...prev,
                [selectedShift.shift?._id]: timesheetData.data
            }));
        }
    }, [timesheetData, selectedShift]);


    // Effect to select the first shift by default
    useEffect(() => {
        if (selectedShifts && selectedShifts.length > 0 && !selectedShift) {
            setSelectedShift(selectedShifts[0]);
        }
    }, [selectedShifts, selectedShift]);

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
    const handleTimesheetRequest = (shift: any) => {
        setSelectedShift(shift);
        setIsTimesheetStepperOpen(true);
    };

    // Toggle address expansion
    const toggleAddressExpansion = (id: string) => {
        setExpandedAddress(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Utility functions for UI styling
    const getTimesheetStatusColor = (status?: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    };

    const getAssignmentStatusColor = (status?: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'assigned': return 'success';
            case 'signed': return 'success';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    };

    const getShiftColor = (shiftName?: string) => {
        if (!shiftName) return 'hsl(210, 85%, 55%)';

        let hash = 0;
        for (let i = 0; i < shiftName.length; i++) {
            hash = shiftName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 85%, 55%)`;
    };

    // Handler for QR code generation - used by the stepper component
    const handleGenerateQRCode = async (shift: any) => {
        try {
            // Placeholder for actual API call
            // const response = await createQRCode({
            //   shiftId: shift.shift?._id,
            //   shiftPattern: shift.shift?.shiftPattern?._id,
            //   homeId: shift.shift?.homeId?._id,
            // }).unwrap();

            // Mock response for demo
            const response = {
                barcode: "mockBarcode123",
                success: true
            };

            return response;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    };

    // UI Components
    const StatusBadge = ({ status, size = 'sm' }: { status?: string, size?: 'sm' | 'default' }) => (
        <Badge variant={getTimesheetStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status || 'Unknown'}
        </Badge>
    );

    const AStatusBadge = ({ status, size = 'sm' }: { status?: string, size?: 'sm' | 'default' }) => (
        <Badge variant={getAssignmentStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status || 'pending'}
        </Badge>
    );

    // Get the current timesheet status for a shift
    const getTimesheetStatus = (shift: any) => {
        // Check if we have timesheet data for this shift in our map
        const timesheetData = timesheetDataMap[shift.shift?._id || ''];
        if (timesheetData) {
            return timesheetData.status;
        }

        // If no timesheet data and shift has a timesheet field
        if (shift.timesheet?.status) {
            return shift.timesheet.status;
        }

        return null;
    };

    // Determine if a shift has a timesheet
    const hasTimesheet = (shift: any) => {
        return !!timesheetDataMap[shift.shift?._id || ''] || !!shift.timesheet;
    };

    // Get the shift timing
    const getShiftTiming = (assignment: any) => {
        const startTime = assignment.shift?.shiftPattern?.timings?.find(
            (timing: any) => timing.careHomeId === assignment.shift?.homeId?._id
        )?.startTime || '00:00';

        const endTime = assignment.shift?.shiftPattern?.timings?.find(
            (timing: any) => timing.careHomeId === assignment.shift?.homeId?._id
        )?.endTime || '00:00';

        return { startTime, endTime };
    };

    // Calculate shift duration in hours
    const calculateShiftDuration = (startTime: string, endTime: string) => {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let hours = endHour - startHour;
        let minutes = endMinute - startMinute;

        if (minutes < 0) {
            hours -= 1;
            minutes += 60;
        }

        if (hours < 0) {
            hours += 24; // Handle overnight shifts
        }

        return hours + (minutes / 60);
    };

    // Check if shift is signed
    const isShiftSigned = (shift: any) => {
        return shift.status === 'signed';
    };

    // Get the appropriate button text and icon based on shift status
    const getTimesheetButtonConfig = (shift: any) => {
        const timesheetStatus = getTimesheetStatus(shift);
        const isSigned = isShiftSigned(shift);

        if (processingShiftId === shift._id) {
            return {
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                text: 'Processing...',
                disabled: true
            };
        }

        if (timesheetStatus === 'approved') {
            return {
                icon: <CheckCircle2 className="h-4 w-4" />,
                text: 'Timesheet Approved',
                disabled: true
            };
        }

        if (timesheetStatus === 'pending') {
            return {
                icon: <QrCodeIcon className="h-4 w-4" />,
                text: 'Update Timesheet',
                disabled: false
            };
        }

        if (isSigned) {
            return {
                icon: <QrCodeIcon className="h-4 w-4" />,
                text: 'Create Timesheet',
                disabled: false
            };
        }

        return {
            icon: <QrCodeIcon className="h-4 w-4" />,
            text: 'Request Timesheet',
            disabled: false
        };
    };

    // Shift selection component for mobile
    const renderShiftSelector = () => {
        if (selectedShifts.length <= 1) return null;

        return (
            <div className="mb-4">
                <Tabs
                    defaultValue={selectedShifts[0]?._id}
                    value={selectedShift?._id}
                    onValueChange={(value) => {
                        const shift = selectedShifts.find(s => s._id === value);
                        if (shift) setSelectedShift(shift);
                    }}
                >
                    <TabsList className="w-full grid grid-flow-col">
                        {selectedShifts.map(shift => (
                            <TabsTrigger key={shift._id} value={shift._id} className="text-sm">
                                <div className="flex flex-col items-center">
                                    <span className="font-medium">{shift.shift?.shiftPattern?.name?.substring(0, 8) || 'Shift'}</span>
                                    <span className="text-xs">{getShiftTiming(shift).startTime}</span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
        );
    };

    // Detailed view of a shift
    const renderShiftDetail = (assignment: any) => {
        if (!assignment) return null;

        const { startTime, endTime } = getShiftTiming(assignment);
        const shiftDuration = calculateShiftDuration(startTime, endTime);
        const currentTimesheetStatus = getTimesheetStatus(assignment);
        const shiftHasTimesheet = hasTimesheet(assignment);
        const shiftDate = selectedDate?.format('dddd, MMMM D, YYYY') || '';

        // Calculate shift progress if it's the current day
        const now = moment();
        const shiftStartTime = moment(assignment.shift?.date).set({
            hour: parseInt(startTime.split(':')[0]),
            minute: parseInt(startTime.split(':')[1])
        });

        const shiftEndTime = moment(assignment.shift?.date).set({
            hour: parseInt(endTime.split(':')[0]),
            minute: parseInt(endTime.split(':')[1])
        });

        // Handle overnight shifts
        if (shiftEndTime.isBefore(shiftStartTime)) {
            shiftEndTime.add(1, 'day');
        }

        let shiftProgress = 0;
        let shiftStatus = '';

        if (now.isBefore(shiftStartTime)) {
            shiftStatus = 'Upcoming';
        } else if (now.isAfter(shiftEndTime)) {
            shiftStatus = 'Completed';
            shiftProgress = 100;
        } else {
            shiftStatus = 'In Progress';
            const totalDuration = shiftEndTime.diff(shiftStartTime, 'minutes');
            const elapsed = now.diff(shiftStartTime, 'minutes');
            shiftProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        }

        return (
            <div className="space-y-6">
                {/* Header with timing and status */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{assignment.shift?.shiftPattern?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{shiftDate}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <AStatusBadge status={assignment?.status} size="default" />
                        {shiftHasTimesheet && (
                            <span className="text-xs text-muted-foreground mt-1">
                                Timesheet: <StatusBadge status={currentTimesheetStatus} />
                            </span>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Shift time and progress */}
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <span className="font-medium">Shift Hours</span>
                        </div>
                        <div className="font-medium">
                            {startTime} - {endTime} ({shiftDuration.toFixed(1)} hrs)
                        </div>
                    </div>

                    {moment().isSame(moment(assignment.shift?.date), 'day') && (
                        <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{shiftStatus}</span>
                                <span>{shiftProgress}%</span>
                            </div>
                            <Progress value={shiftProgress} className="h-2" />
                        </div>
                    )}
                </div>

                {/* Location details */}
                <div className="rounded-lg border p-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium">{assignment.shift?.homeId?.name}</h3>
                                <Collapsible
                                    open={expandedAddress[assignment._id] || false}
                                    onOpenChange={() => toggleAddressExpansion(assignment._id)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto text-xs">
                                            Show Address <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="text-sm text-muted-foreground mt-2 space-y-1">
                                        {assignment.shift?.homeId?.address && (
                                            <>
                                                <p>{assignment.shift.homeId.address.street}</p>
                                                <p>{assignment.shift.homeId.address.city}, {assignment.shift.homeId.address.zipCode}</p>
                                            </>
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </div>
                        {assignment.shift?.homeId?.address && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNavigation(assignment.shift?.homeId?.address)}
                                className="gap-1"
                            >
                                <MapPinIcon className="h-4 w-4" />
                                Directions
                            </Button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <Button
                        className="w-full gap-2"
                        size="lg"
                        disabled={currentTimesheetStatus === 'approved' || processingShiftId === assignment._id}
                        onClick={() => handleTimesheetRequest(assignment)}
                    >
                        {processingShiftId === assignment._id ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : currentTimesheetStatus === 'approved' ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Timesheet Approved
                            </>
                        ) : currentTimesheetStatus === 'pending' ? (
                            <>
                                <QrCodeIcon className="h-4 w-4" />
                                Update Timesheet
                            </>
                        ) : (
                            <>
                                <QrCodeIcon className="h-4 w-4" />
                                Request Timesheet
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Global loading overlay */}
            {isLoadingUI && <LoadingOverlay isVisible={isLoadingUI} message="Processing request..." />}

            {/* Main shift details dialog */}
            <Dialog open={open} onOpenChange={() => onClose()}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 rounded-full p-2">
                                <CalendarClock className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">
                                Shift Details
                            </h2>
                        </div>
                    </DialogHeader>

                    <div>
                        {/* Mobile shift selector tabs */}
                        {isMobile && renderShiftSelector()}

                        {/* Detailed shift view */}
                        {renderShiftDetail(selectedShift)}
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

            {/* Timesheet stepper dialog */}
            <TimesheetStepperFlow
                open={isTimesheetStepperOpen}
                onClose={() => setIsTimesheetStepperOpen(false)}
                selectedDate={selectedDate}
                selectedShifts={selectedShift ? [selectedShift] : []}
                onRequestQRCode={handleGenerateQRCode}
                refetch={refetch}
            />
        </>
    );
};

export default ShiftViewDialog;