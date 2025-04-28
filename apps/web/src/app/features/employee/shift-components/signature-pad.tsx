import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Pen, ArrowLeft, Check, X } from 'lucide-react';

interface SignaturePadModalProps {
    open: boolean;
    onClose: () => void;
    onSignatureCapture: (signatureData: string, signerName: string, signerRole: string) => void;
    title: string;
    description: string;
    isSubmitting?: boolean;
}

const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
    open,
    onClose,
    onSignatureCapture,
    title,
    description,
    isSubmitting = false
}) => {
    // State for the two-step process
    const [step, setStep] = useState<'info' | 'signature'>('info');

    // Form state
    const [signerName, setSignerName] = useState('');
    const [signerRole, setSignerRole] = useState('');
    const [signatureData, setSignatureData] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    // Validation state
    const [nameError, setNameError] = useState('');
    const [roleError, setRoleError] = useState('');

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPositionRef = useRef({ x: 0, y: 0 });

    // Clear form on open
    useEffect(() => {
        if (open) {
            resetForm();
        }
    }, [open]);

    // Initialize canvas when switching to signature step
    useEffect(() => {
        if (step === 'signature' && canvasRef.current) {
            resizeCanvas();
            clearCanvas();
        }
    }, [step]);

    // Handle window resize
    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const resetForm = () => {
        setStep('info');
        setSignerName('');
        setSignerRole('');
        setSignatureData('');
        setHasSigned(false);
        setNameError('');
        setRoleError('');
    };

    const resizeCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const parent = canvas.parentElement;

        if (parent) {
            const rect = parent.getBoundingClientRect();

            // Set canvas dimensions to match parent
            canvas.width = rect.width;
            canvas.height = 200; // Fixed height for signature

            // If there was a signature, it will be lost on resize, so clear the state
            setHasSigned(false);
            setSignatureData('');

            // Clear the canvas
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

    // Validate the first step
    const validateInfoStep = () => {
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

    // Move to the signature step
    const handleContinue = () => {
        if (validateInfoStep()) {
            setStep('signature');
        }
    };

    // Go back to the info step
    const handleBack = () => {
        setStep('info');
    };

    // Drawing functions
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

    const getEventPosition = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
        canvas: HTMLCanvasElement
    ) => {
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

    const handleSubmit = () => {
        if (!hasSigned) return;
        onSignatureCapture(signatureData, signerName, signerRole);
    };

    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen && !isSubmitting) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Collect Name and Role */}
                {step === 'info' && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="signerName">Full Name</Label>
                            <Input
                                id="signerName"
                                type="text"
                                placeholder="Enter full name"
                                value={signerName}
                                autoFocus={false}
                                onChange={(e) => setSignerName(e.target.value)}
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                {/* senior carer */}
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="senior carer" id="senior-carer" />
                                    <Label htmlFor="senior-carer">Senior Carer</Label>
                                </div>
                            </RadioGroup>
                            {roleError && (
                                <p className="text-sm text-red-500">{roleError}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Signature Pad */}
                {step === 'signature' && (
                    <div className="space-y-4 py-4">
                        <p className="text-sm">
                            <strong>Name:</strong> {signerName} &nbsp;|&nbsp; <strong>Role:</strong> {signerRole}
                        </p>

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

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearCanvas}
                            disabled={isSubmitting}
                        >
                            Clear Signature
                        </Button>

                        {!hasSigned && (
                            <p className="text-sm text-amber-600">Please sign above</p>
                        )}
                    </div>
                )}

                <DialogFooter className={`${isMobile ? 'flex-col space-y-2' : 'flex-row space-x-2'}`}>
                    {/* Step 1 Buttons */}
                    {step === 'info' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className={`${isMobile ? 'w-full' : ''}`}
                                disabled={isSubmitting}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleContinue}
                                className={`${isMobile ? 'w-full' : ''}`}
                                disabled={isSubmitting}
                            >
                                Continue
                                <Pen className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {/* Step 2 Buttons */}
                    {step === 'signature' && (
                        <div className={`${isMobile ? 'grid grid-cols-2 gap-2 w-full' : 'flex justify-end space-x-2'}`}>
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className={isMobile ? 'w-full' : ''}
                                disabled={isSubmitting}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className={isMobile ? 'w-full' : ''}
                                disabled={isSubmitting}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className={isMobile ? 'w-full' : ''}
                                disabled={!hasSigned || isSubmitting}
                            >
                                {isSubmitting ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Confirm
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SignaturePadModal;