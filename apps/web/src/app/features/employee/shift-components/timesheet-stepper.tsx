import React, { useState, useEffect, useRef } from 'react';
import {
    QrCodeIcon, Pen, X, Loader2, ChevronLeft, ChevronRight,
    Check, HomeIcon, TimerIcon, Paperclip, Navigation, RefreshCw, ArrowLeft
} from 'lucide-react';
import moment from 'moment';
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingOverlay } from "@/components/loading-overlay";

// Import API hooks
import {
    useCreateTimesheetForSignatureMutation,
    useApproveTimesheetWithSignatureMutation,
    useGetUserTimesheetByShiftIdQuery
} from '../../timesheets/timesheetApi';

// Types
import { IShiftAssignment } from '@wyecare-monorepo/shared-types';

/**
 * This component implements a simplified timesheet approval flow using a stepper UI
 * It consolidates multiple dialogs into a single flow for better UX
 */
const TimesheetStepperFlow = ({
    open,
    onClose,
    selectedDate,
    selectedShifts,
    onRequestQRCode,
    refetch
}: {
    open: boolean;
    onClose: () => void;
    selectedDate: string;
    selectedShifts: IShiftAssignment[];
    onRequestQRCode: (assignment: IShiftAssignment) => Promise<{ barcode?: string }>;
    refetch?: () => void;
}) => {
    // Main state variables
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedShift, setSelectedShift] = useState(null);
    const [approvalMethod, setApprovalMethod] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timesheetId, setTimesheetId] = useState(null);
    const [currentQrCode, setCurrentQrCode] = useState(null);
    const [timesheetStatus, setTimesheetStatus] = useState(null);
    const [isLoadingUI, setIsLoadingUI] = useState(false);

    // Signature form state
    const [signerName, setSignerName] = useState('');
    const [signerRole, setSignerRole] = useState('');
    const [signatureData, setSignatureData] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    // Validation state
    const [nameError, setNameError] = useState('');
    const [roleError, setRoleError] = useState('');

    // Canvas ref for signature
    const canvasRef = useRef(null);
    const lastPositionRef = useRef({ x: 0, y: 0 });

    // Get device information
    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;

    // API hooks
    const [createTimesheet] = useCreateTimesheetForSignatureMutation();
    const [approveWithSignature] = useApproveTimesheetWithSignatureMutation();

    // Fetch timesheet data when a shift is selected
    const {
        data: fetchedTimesheetData,
        isLoading: isTimesheetLoading,
        refetch: refetchTimesheet
    } = useGetUserTimesheetByShiftIdQuery({
        shiftId: selectedShift?.shift?._id || '',
        userId: selectedShift?.user?._id || ''
    }, {
        skip: !selectedShift?.shift?._id,
        refetchOnMountOrArgChange: true
    });

    // Update timesheet status when data is fetched
    useEffect(() => {
        if (fetchedTimesheetData?.success && fetchedTimesheetData?.data) {
            setTimesheetId(fetchedTimesheetData.data._id);
            setTimesheetStatus(fetchedTimesheetData.data.status);
        }
    }, [fetchedTimesheetData]);

    // Setup SSE connection for QR code scanning
    useEffect(() => {
        let eventSource = null;

        if (currentQrCode && approvalMethod === 'qrcode' && currentStep === 2) {
            const baseUrl = import.meta.env.VITE_APP_API_HOSTNAME;
            eventSource = new EventSource(
                `${baseUrl}/api/v1/timesheet/timesheet-events?qrCode=${currentQrCode}`
            );

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.status === 'success') {
                    setTimesheetStatus('approved');
                    setCurrentStep(3); // Move to confirmation step
                    refetch && refetch();
                    toast.success('Timesheet approved successfully!');
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE error:', error);
            };
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [currentQrCode, approvalMethod, currentStep]);

    // Reset component state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            // Reset everything when dialog closes
            setTimeout(() => {
                resetForm();
            }, 300);
        }
    }, [open]);

    // Initialize canvas when in signature step
    useEffect(() => {
        if (currentStep === 2 && approvalMethod === 'signature' && canvasRef.current) {
            resizeCanvas();
            clearCanvas();
        }
    }, [currentStep, approvalMethod]);

    // Handle window resize for canvas
    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Reset all form data
    const resetForm = () => {
        setCurrentStep(0);
        setSelectedShift(null);
        setApprovalMethod(null);
        setCurrentQrCode(null);
        setTimesheetId(null);
        setSignerName('');
        setSignerRole('');
        setSignatureData('');
        setHasSigned(false);
        setNameError('');
        setRoleError('');
        setTimesheetStatus(null);
    };

    // Canvas functions for signature
    const resizeCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const parent = canvas.parentElement;

        if (parent) {
            const rect = parent.getBoundingClientRect();

            // Set canvas dimensions to match parent
            canvas.width = rect.width;
            canvas.height = 200; // Fixed height for signature

            // Clear the canvas and reset signature state
            clearCanvas();
        }
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = '#f9fafb'; // Light gray background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw a line at the bottom to indicate where to sign
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 10);
            ctx.lineTo(canvas.width, canvas.height - 10);
            ctx.stroke();

            setHasSigned(false);
            setSignatureData('');
        }
    };

    // Drawing functions for signature
    const startDrawing = (e) => {
        if (!canvasRef.current) return;

        setIsDrawing(true);
        setHasSigned(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            const pos = getEventPosition(e, canvas);
            lastPositionRef.current = pos;

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
        }
    };

    const draw = (e) => {
        if (!isDrawing || !canvasRef.current) return;

        // Prevent scrolling on touch devices
        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            const pos = getEventPosition(e, canvas);

            ctx.beginPath();
            ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastPositionRef.current = pos;
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || !canvasRef.current) return;

        setIsDrawing(false);

        const canvas = canvasRef.current;
        setSignatureData(canvas.toDataURL('image/png'));
    };

    const getEventPosition = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            // Touch event
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            // Mouse event
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    // Helper functions
    const getShiftColor = (shiftName) => {
        if (!shiftName) return 'hsl(210, 85%, 55%)';

        let hash = 0;
        for (let i = 0; i < shiftName.length; i++) {
            hash = shiftName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 85%, 55%)`;
    };

    const getTimesheetStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    };

    const getAssignmentStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'assigned': return 'success';
            case 'rejected': return 'destructive';
            default: return 'secondary';
        }
    };

    const openNavigation = (address) => {
        if (!address) return;

        const addressQuery = [
            address.street,
            address.city,
            address.state,
            address.zipCode,
            address.country || 'UK'
        ].filter(Boolean).join(', ');

        const platform = Capacitor.getPlatform();

        if (platform === 'ios') {
            window.open(`maps://?q=${encodeURIComponent(addressQuery)}`, '_system');
        } else {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`, '_system');
        }
    };

    // Step handlers
    const handleSelectShift = (shift) => {
        setSelectedShift(shift);
        setCurrentStep(1);
        refetchTimesheet();
    };

    const handleSelectApprovalMethod = async (method) => {
        setApprovalMethod(method);
        setIsProcessing(true);

        try {
            // For both methods, ensure we have a timesheet
            if (!timesheetId) {
                const result = await createTimesheet({
                    shiftId: selectedShift.shift._id,
                    homeId: selectedShift.shift.homeId._id
                }).unwrap();

                if (result.success && result.timesheet) {
                    setTimesheetId(result.timesheet._id);
                }
            }

            if (method === 'qrcode') {
                // Handle QR code generation
                const response = await onRequestQRCode(selectedShift);
                if (response?.barcode) {
                    setCurrentQrCode(response.barcode);
                }
            }

            setCurrentStep(2);
        } catch (error) {
            console.error('Error preparing approval method:', error);
            toast.error('Failed to prepare approval process. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Validate signature form
    const validateSignatureForm = () => {
        let isValid = true;

        if (!signerName.trim()) {
            setNameError('Name is required');
            isValid = false;
        } else {
            setNameError('');
        }

        if (!signerRole) {
            setRoleError('Please select a role');
            isValid = false;
        } else {
            setRoleError('');
        }

        return isValid;
    };

    // Handle signature submission
    const handleSignatureSubmit = async () => {
        if (!validateSignatureForm()) {
            return;
        }

        if (!hasSigned) {
            toast.error('Please provide a signature');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await approveWithSignature({
                timesheetId: timesheetId,
                signatureData: signatureData,
                signerName: signerName.trim(),
                signerRole: signerRole,
            }).unwrap();

            setTimesheetStatus('approved');
            setCurrentStep(3); // Move to confirmation step
            refetch && refetch();
            toast.success('Timesheet approved successfully!');
        } catch (error) {
            console.error('Error submitting signature:', error);
            toast.error('Failed to submit signature. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Navigate between steps
    const goToNextStep = () => {
        if (currentStep === 0 && !selectedShift) {
            toast.error('Please select a shift to continue');
            return;
        }

        if (currentStep === 1 && !approvalMethod) {
            toast.error('Please select an approval method');
            return;
        }

        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // UI Components
    const StatusBadge = ({ status, size = 'sm' }: {
        status: string;
        size?: 'sm' | 'lg';
    }) => (
        <Badge variant={getTimesheetStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status}
        </Badge>
    );

    const AStatusBadge = ({ status, size = 'sm' }: {
        status: string;
        size?: 'sm' | 'lg';
    }) => (
        <Badge variant={getAssignmentStatusColor(status)} className={`capitalize ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {status}
        </Badge>
    );

    const InfoRow = ({ icon: Icon, text, badge }: {
        icon: React.ElementType;
        text: string;
        badge?: React.ReactNode;
    }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
            <span className={`flex-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {text}
            </span>
            {badge && badge}
        </div>
    );

    // StepIndicator component to show progress
    const StepIndicator = () => {
        const steps = [
            { name: 'Select Shift' },
            { name: 'Method' },
            { name: approvalMethod === 'qrcode' ? 'QR Code' : 'Signature' },
            { name: 'Confirm' }
        ];

        return (
            <div className="flex justify-between items-center w-full mb-4">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center relative">
                        <div
                            className={`
                h-8 w-8 rounded-full flex items-center justify-center z-10
                ${index === currentStep ? 'bg-primary text-white' :
                                    index < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
              `}
                        >
                            {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                        </div>
                        <span className={`text-xs mt-1 ${index === currentStep ? 'font-medium text-primary' : 'text-gray-500'}`}>
                            {step.name}
                        </span>

                        {/* Connector lines between steps */}
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-4 left-8 h-0.5 w-full 
                  ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Render content for each step
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Shift Selection
                return (
                    <div className="grid gap-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Select a shift to create or update a timesheet:
                        </p>
                        {selectedShifts.map((assignment) => (
                            <Card
                                key={assignment._id}
                                className={`transition-all duration-200 hover:-translate-y-0.5 cursor-pointer
                  ${selectedShift?._id === assignment._id ? 'ring-2 ring-primary' : ''}
                `}
                                onClick={() => handleSelectShift(assignment)}
                            >
                                <CardContent className="p-4">
                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10" style={{ backgroundColor: getShiftColor(assignment.shift?.shiftPattern?.name) }}>
                                                <AvatarFallback className="font-semibold">
                                                    {assignment.shift?.shiftPattern?.name?.substring(0, 2).toUpperCase() || 'SH'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold">
                                                    {assignment.shift?.shiftPattern?.name || 'Shift'}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <HomeIcon className="h-3 w-3" />
                                                    <span>{assignment.shift?.homeId?.name || 'Care Home'}</span>
                                                </div>
                                            </div>
                                            <AStatusBadge status={assignment.status || 'pending'} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );

            case 1: // Approval Method Selection
                return (
                    <div className="grid gap-6 py-2">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* QR Code option */}
                            <Card
                                className={`cursor-pointer hover:shadow-md transition-all 
                  ${approvalMethod === 'qrcode' ? 'ring-2 ring-primary' : ''}
                  ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                `}
                                onClick={() => !isProcessing && handleSelectApprovalMethod('qrcode')}
                            >
                                <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                                    <QrCodeIcon className="h-16 w-16 text-primary" />
                                    <div className="text-center">
                                        <h3 className="font-medium text-lg">QR Code</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Generate a QR code for care home admin to scan
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Signature option */}
                            <Card
                                className={`cursor-pointer hover:shadow-md transition-all
                  ${approvalMethod === 'signature' ? 'ring-2 ring-primary' : ''}
                  ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                `}
                                onClick={() => !isProcessing && handleSelectApprovalMethod('signature')}
                            >
                                <CardContent className="p-4 flex flex-col items-center justify-center gap-4">
                                    <Pen className="h-16 w-16 text-primary" />
                                    <div className="text-center">
                                        <h3 className="font-medium text-lg">Signature</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Collect care home admin signature directly
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Shift details */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Selected Shift</h4>
                            <div className="space-y-2">
                                <InfoRow
                                    icon={HomeIcon}
                                    text={selectedShift?.shift?.homeId?.name || 'Care Home'}
                                />
                                <InfoRow
                                    icon={TimerIcon}
                                    text={`${selectedShift?.shift?.shiftPattern?.timings?.find(
                                        (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                    )?.startTime || '00:00'} - ${selectedShift?.shift?.shiftPattern?.timings?.find(
                                        (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                    )?.endTime || '00:00'}`}
                                />
                                {timesheetStatus && (
                                    <InfoRow
                                        icon={Paperclip}
                                        text="Timesheet Status:"
                                        badge={<StatusBadge status={timesheetStatus} />}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 2: // QR Code or Signature based on method
                if (approvalMethod === 'qrcode') {
                    // QR Code step
                    return (
                        <div className="grid gap-6 py-2">
                            <div className="bg-gray-50 p-8 rounded-lg flex flex-col items-center justify-center">
                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                        <p>Generating QR code...</p>
                                    </div>
                                ) : currentQrCode ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-white rounded-lg">
                                            <img
                                                src={`data:image/png;base64,${currentQrCode}`}
                                                alt="QR Code for timesheet approval"
                                                className="w-64 h-64 object-contain"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="font-medium">Scan with admin device</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Waiting for admin to scan and approve...
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <QrCodeIcon className="h-16 w-16 text-gray-300" />
                                        <p className="text-sm text-muted-foreground">QR code failed to generate</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSelectApprovalMethod('qrcode')}
                                            className="mt-2"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Try Again
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Shift details reminder */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">Shift Details</h4>
                                <div className="space-y-2">
                                    <InfoRow
                                        icon={HomeIcon}
                                        text={selectedShift?.shift?.homeId?.name || 'Care Home'}
                                    />
                                    <InfoRow
                                        icon={TimerIcon}
                                        text={`${selectedShift?.shift?.shiftPattern?.timings?.find(
                                            (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                        )?.startTime || '00:00'} - ${selectedShift?.shift?.shiftPattern?.timings?.find(
                                            (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                        )?.endTime || '00:00'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                } else {
                    // Signature method - using your existing signature component flow
                    return (
                        <div className="grid gap-6 py-2">
                            <div className="bg-white p-4 rounded-lg">
                                {/* Signer information form */}
                                <div className="space-y-4 mb-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signerName">Full Name</Label>
                                        <Input
                                            id="signerName"
                                            type="text"
                                            placeholder="Enter full name"
                                            value={signerName}
                                            onChange={(e) => setSignerName(e.target.value)}
                                            disabled={isProcessing}
                                        />
                                        {nameError && (
                                            <p className="text-sm text-red-500">{nameError}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <RadioGroup
                                            value={signerRole}
                                            onValueChange={setSignerRole}
                                            disabled={isProcessing}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="admin" id="admin" />
                                                <Label htmlFor="admin">Admin</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="manager" id="manager" />
                                                <Label htmlFor="manager">Manager</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nurse" id="nurse" />
                                                <Label htmlFor="nurse">Nurse</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="senior carer" id="senior-carer" />
                                                <Label htmlFor="senior-carer">Senior Carer</Label>
                                            </div>
                                        </RadioGroup>
                                        {roleError && (
                                            <p className="text-sm text-red-500">{roleError}</p>
                                        )}
                                    </div>

                                    {/* Signature canvas */}
                                    <div className="space-y-2 mt-4">
                                        <Label>Signature</Label>
                                        <div className="border rounded-md p-1 bg-gray-50">
                                            <canvas
                                                ref={canvasRef}
                                                className="w-full touch-none"
                                                style={{ height: '200px' }}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={clearCanvas}
                                                disabled={isProcessing}
                                            >
                                                Clear Signature
                                            </Button>

                                            {!hasSigned && (
                                                <p className="text-sm text-amber-600">Please sign above</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSignatureSubmit}
                                    disabled={isProcessing || !hasSigned}
                                    className="w-full mt-4"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Submit Approval
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    );
                }

            case 3: // Confirmation
                return (
                    <div className="grid gap-6 py-6">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Timesheet Approved</h3>
                            <p className="text-gray-600 mb-4">
                                The timesheet has been successfully approved and recorded in the system.
                            </p>
                            <StatusBadge status="approved" size="default" />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Shift Summary</h4>
                            <div className="space-y-2">
                                <InfoRow
                                    icon={HomeIcon}
                                    text={selectedShift?.shift?.homeId?.name || 'Care Home'}
                                />
                                <InfoRow
                                    icon={TimerIcon}
                                    text={`${selectedShift?.shift?.shiftPattern?.timings?.find(
                                        (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                    )?.startTime || '00:00'} - ${selectedShift?.shift?.shiftPattern?.timings?.find(
                                        (timing) => timing.careHomeId === selectedShift?.shift?.homeId?._id
                                    )?.endTime || '00:00'}`}
                                />
                                <InfoRow
                                    icon={Paperclip}
                                    text="Timesheet Status:"
                                    badge={<StatusBadge status="approved" />}
                                />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Navigation buttons based on current step
    const renderNavigation = () => {
        // In the last step (confirmation), only show a Close button
        if (currentStep === 3) {
            return (
                <Button onClick={onClose} className={isMobile ? "w-full" : ""}>
                    Close
                </Button>
            );
        }

        // In the QR code step, don't show Next button
        if (currentStep === 2 && approvalMethod === 'qrcode') {
            return (
                <div className="flex gap-2 justify-between w-full">
                    <Button variant="outline" onClick={goToPrevStep} disabled={isProcessing}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                </div>
            );
        }

        // In the signature step, don't show Next button (using dedicated Submit button)
        if (currentStep === 2 && approvalMethod === 'signature') {
            return (
                <div className="flex gap-2 justify-between w-full">
                    <Button variant="outline" onClick={goToPrevStep} disabled={isProcessing}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                </div>
            );
        }

        // Default navigation for steps 0-1
        return (
            <div className="flex gap-2 justify-between w-full">
                {currentStep > 0 && (
                    <Button variant="outline" onClick={goToPrevStep} disabled={isProcessing}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                )}
                <div className="flex-1" />
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                    Cancel
                </Button>
                <Button onClick={goToNextStep} disabled={isProcessing}>
                    {currentStep === 1 ? (
                        isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </>
                        )
                    ) : (
                        <>
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        );
    };

    return (
        <>
            {/* Global loading overlay */}
            {isLoadingUI && <LoadingOverlay isVisible={isLoadingUI} message="Processing request..." />}

            <Dialog open={open} onOpenChange={(open) => !isProcessing && onClose()}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Timesheet Approval
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDate?.format('dddd, MMMM D, YYYY')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step indicator */}
                    <StepIndicator />

                    {/* Dynamic content based on current step */}
                    <div className="min-h-[300px]">
                        {renderStepContent()}
                    </div>

                    <DialogFooter className="mt-4">
                        {renderNavigation()}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TimesheetStepperFlow;