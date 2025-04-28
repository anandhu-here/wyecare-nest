import React, { useState, useEffect } from 'react';
import { QrCodeIcon, Pen, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import SignaturePadModal from './signature-pad'; // Import your new SignaturePadModal
import { IShiftAssignment } from '@wyecare-monorepo/shared-types';
import { useDispatch } from 'react-redux';
import { useApproveTimesheetWithSignatureMutation, useCreateTimesheetForSignatureMutation } from '../../timesheets/timesheetApi';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '@/components/loading-overlay';

interface ApprovalOptionsDialogProps {
    open: boolean;
    onClose: () => void;
    shift: IShiftAssignment | null;
    timesheetData?: any; // Add prop for timesheet data from parent
    onRequestQRCode: (shift: IShiftAssignment) => void;
    onTimesheetApproved?: (shift: IShiftAssignment) => void; // Added callback for refresh
}

const ApprovalOptionsDialog: React.FC<ApprovalOptionsDialogProps> = ({
    open,
    onClose,
    shift,
    timesheetData,
    onRequestQRCode,
    onTimesheetApproved
}) => {
    const dispatch = useDispatch();
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
    const [approvalOptionsOpen, setApprovalOptionsOpen] = useState(open);
    const [currentShift, setCurrentShift] = useState<IShiftAssignment | null>(null);
    const [timesheetId, setTimesheetId] = useState<string | null>(null);
    const [isLoadingUI, setIsLoadingUI] = useState(false);

    // Effect to synchronize open prop with internal state
    useEffect(() => {
        setApprovalOptionsOpen(open);
    }, [open]);

    // Update currentShift and timesheetId when shift or timesheetData props change
    useEffect(() => {
        if (shift) {
            setCurrentShift(JSON.parse(JSON.stringify(shift))); // Create a deep copy

            // First try to get timesheet ID from the passed timesheetData
            if (timesheetData && timesheetData._id) {
                setTimesheetId(timesheetData._id);
            }
            // Fallback to shift's timesheet ID if available
            else if (shift.timesheet?._id) {
                setTimesheetId(shift.timesheet._id);
            } else {
                setTimesheetId(null);
            }
        }
    }, [shift, timesheetData]);

    // Also listen for DOM changes to support the programmatic approach
    useEffect(() => {
        const approvalOptionsBtn = document.getElementById('approval-options-dialog');
        if (approvalOptionsBtn) {
            const handleClick = () => {
                setApprovalOptionsOpen(true);
                // Directly go to signature option since we're coming from the timesheet options dialog
                handleSignatureOption();
            };
            approvalOptionsBtn.addEventListener('click', handleClick);
            return () => approvalOptionsBtn.removeEventListener('click', handleClick);
        }
    }, [currentShift, timesheetId]);

    const [createTimesheet, { isLoading: isCreatingTimesheet }] = useCreateTimesheetForSignatureMutation();
    const [approveWithSignature] = useApproveTimesheetWithSignatureMutation();

    const handleSignatureOption = async () => {
        if (!currentShift) {
            toast.error('No shift data available for signature approval.');
            return;
        }

        setIsProcessing(true);
        setIsLoadingUI(true); // Show global loading UI

        try {
            // If no timesheet exists yet or timesheet needs to be updated, create one first
            if (!timesheetId) {
                const result = await createTimesheet({
                    shiftId: currentShift.shift._id,
                    homeId: currentShift.shift.homeId._id
                }).unwrap();
                if (result.success && result.timesheet) {
                    // Store the timesheet ID for later use
                    setTimesheetId(result.timesheet._id);

                    // Update the local copy of the shift
                    const updatedShift = { ...currentShift };
                    updatedShift.timesheet = result.timesheet;
                    setCurrentShift(updatedShift);
                }
            }

            // Close the options dialog first to prevent stacking modals
            setApprovalOptionsOpen(false);

            // Small delay to ensure smooth transition between dialogs
            setTimeout(() => {
                setShowSignatureModal(true);
                setIsProcessing(false);
                setIsLoadingUI(false); // Hide global loading UI
            }, 300);
        } catch (error: any) {
            setIsProcessing(false);
            setIsLoadingUI(false); // Hide global loading UI
            console.error('Error creating timesheet:', error);
            toast.error('Failed to create timesheet for signature approval.');
        }
    };

    const handleQROption = () => {
        if (shift) {
            onRequestQRCode(shift);
            setApprovalOptionsOpen(false);
        }
    };

    const handleSignatureCapture = async (
        signatureData: string,
        signerName: string,
        signerRole: string
    ) => {
        setIsSubmittingSignature(true);
        setIsLoadingUI(true); // Show global loading UI

        try {
            // Ensure we have a timesheet ID
            if (!timesheetId) {
                throw new Error("No timesheet ID available for approval");
            }

            const response = await approveWithSignature({
                timesheetId: timesheetId,
                signatureData,
                signerName,
                signerRole,
            }).unwrap();

            // Create a proper deep copy of the nested object
            const updatedShift = {
                ...currentShift,
                timesheet: {
                    ...(currentShift?.timesheet || {}),
                    _id: timesheetId,
                    status: 'approved'
                }
            };

            if (onTimesheetApproved && updatedShift) {
                onTimesheetApproved(updatedShift);
            }

            toast.success('Timesheet approved successfully!');
            setShowSignatureModal(false);
            onClose();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(`Failed to approve timesheet: ${error.message || 'Please try again'}`);
        } finally {
            setIsSubmittingSignature(false);
            setIsLoadingUI(false); // Hide global loading UI
        }
    };

    const isMobile = window.matchMedia('(max-width: 640px)').matches;

    return (
        <>
            {/* Global loading overlay */}
            {isLoadingUI && <LoadingOverlay isVisible={isLoadingUI} message="Processing timesheet..." />}

            <Dialog open={approvalOptionsOpen} onOpenChange={(open) => {
                // Only allow closing if not in processing state
                if (!isProcessing) {
                    setApprovalOptionsOpen(open);
                    if (!open) onClose();
                }
            }}>
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Choose Approval Method
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={handleQROption}>
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
                            className={`cursor-pointer hover:shadow-md transition-all ${isProcessing ? 'opacity-50' : ''}`}
                            onClick={!isProcessing ? handleSignatureOption : undefined}
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
                                <Button variant="secondary" className="w-full" disabled={isProcessing}>
                                    {isProcessing ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Preparing...
                                        </div>
                                    ) : (
                                        <>
                                            <Pen className="mr-2 h-4 w-4" />
                                            Use Signature
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApprovalOptionsOpen(false);
                                onClose();
                            }}
                            className={`${isMobile ? 'w-full' : ''}`}
                            disabled={isProcessing}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Two-Step Signature Modal with loading state */}
            {showSignatureModal && (
                <SignaturePadModal
                    open={showSignatureModal}
                    onClose={() => {
                        // Only allow closing if not in submitting state
                        if (!isSubmittingSignature) {
                            setShowSignatureModal(false);
                        }
                    }}
                    onSignatureCapture={handleSignatureCapture}
                    title={`Approve Timesheet - ${shift?.shift?.shiftPattern?.name || ''}`}
                    description={`Please complete the approval process for ${shift?.shift?.homeId?.name || ''} on ${shift?.shift?.date || ''}.`}
                    isSubmitting={isSubmittingSignature} // Pass the submitting state
                />
            )}
        </>
    );
};

export default ApprovalOptionsDialog;