import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Loader } from 'lucide-react';

// shadcn UI components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { selectUser } from '../../auth/AuthSlice';
import { toast } from 'react-toastify';
import { useGetAssignedStaffsQuery, useUnassignUserFromShiftMutation } from '../shiftApi';

interface ViewAssignedStaffDialogProps {
    open: boolean;
    onClose: () => void;
    shift: Shift;
    isInternal: boolean;
}

const ViewAssignedStaffDialog: React.FC<ViewAssignedStaffDialogProps> = ({
    open,
    onClose,
    isInternal,
    shift,
}) => {
    const [unassignUserFromShift, { isLoading: isUnassigning }] =
        useUnassignUserFromShiftMutation();

    const dispatch = useDispatch();

    const {
        data: assignedStaffs,
        isLoading: isAssignedStaffsLoading,
        refetch
    } = useGetAssignedStaffsQuery(shift?._id, {
        skip: !shift?._id,
        refetchOnMountOrArgChange: true
    });

    const currentUser = useSelector(selectUser);

    const handleUnassignStaff = async (userId: string) => {
        try {
            await unassignUserFromShift({ shiftId: shift._id, userId }).unwrap();
            onClose();
        } catch (error) {
            console.log(error);
            // dispatch(
            //     toast.success
            // );
            console.error('Failed to unassign staff:', error);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-md p-0 flex flex-col max-h-[90vh]"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                    <DialogTitle>
                        Assigned Staff for {shift.shiftPattern.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto px-6 py-4">
                    {isAssignedStaffsLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="h-8 w-8 animate-spin text-primary-600" />
                        </div>
                    ) : assignedStaffs?.length > 0 ? (
                        <div className="space-y-4">
                            {assignedStaffs.map((assignment) => (
                                <div key={assignment._id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {assignment.user?.avatarUrl ? (
                                                <img
                                                    src={assignment.user.avatarUrl}
                                                    alt={`${assignment.user?.firstName} ${assignment.user?.lastName}`}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                    <span className="text-muted-foreground text-sm">
                                                        {assignment.user?.firstName?.[0]}
                                                        {assignment.user?.lastName?.[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {assignment.user?.firstName} {assignment.user?.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {assignment.user?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isInternal && (
                                        <div className="flex-shrink-0">
                                            <Button
                                                onClick={() => handleUnassignStaff(assignment.user?._id)}
                                                disabled={isUnassigning}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                {isUnassigning ? (
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-40">
                            <p className="text-muted-foreground text-center">
                                No staff assigned to this shift yet.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ViewAssignedStaffDialog;