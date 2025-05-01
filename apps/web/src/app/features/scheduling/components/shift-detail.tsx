import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Heart, Medal, User, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShiftDetailsModalProps {
    open: boolean;
    onClose: () => void;
    shift: any | null;
}

const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({ open, onClose, shift }) => {
    // Early return if shift is not provided
    if (!shift) return null;

    // Render gender preference icons with counts
    const renderGenderPreference = () => {
        const { male, female } = shift.genderPreference || { male: 0, female: 0 };

        return (
            <div className="flex space-x-4 items-center">
                {male > 0 && (
                    <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-500 mr-1" />
                        <span>{male} Male</span>
                    </div>
                )}
                {female > 0 && (
                    <div className="flex items-center">
                        <User className="h-5 w-5 text-pink-500 mr-1" />
                        <span>{female} Female</span>
                    </div>
                )}
                {male === 0 && female === 0 && (
                    <span className="text-muted-foreground">No gender preference specified</span>
                )}
            </div>
        );
    };

    // Render nurse requirement if any
    const renderNurseRequirement = () => {
        const { classification, count } = shift.nursePreference || { classification: 'NA', count: 0 };

        if (count > 0) {
            return (
                <div className="flex items-center">
                    <Medal className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>{count} {classification !== 'NA' ? classification : 'Nurse'} required</span>
                </div>
            );
        }

        return (
            <span className="text-muted-foreground">No nurse requirement specified</span>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Shift Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Gender Preference</h3>
                        {renderGenderPreference()}
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-2">Nurse Requirement</h3>
                        {renderNurseRequirement()}
                    </div>

                    {shift.preferredStaff?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-2">Preferred Staff</h3>
                            <div className="flex flex-wrap gap-2">
                                {shift.preferredStaff.map(staff => (
                                    <Badge key={staff._id} variant="outline" className="flex items-center py-1.5">
                                        <Heart className="h-3 w-3 text-red-500 mr-1" />
                                        {staff.firstName} {staff.lastName}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {shift.notes && (
                        <div>
                            <h3 className="text-sm font-medium mb-2">Notes</h3>
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm text-muted-foreground">{shift.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ShiftDetailsModal;