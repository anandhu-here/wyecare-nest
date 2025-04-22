import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title?: string;
    description?: string;
    itemName?: string;
    isLoading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Delete',
    description,
    itemName,
    isLoading = false
}) => {
    const defaultDescription = itemName
        ? `Are you sure you want to remove ${itemName}? This action cannot be undone.`
        : 'Are you sure you want to delete this item? This action cannot be undone.';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="py-6">
                    <p className="text-sm text-muted-foreground">
                        {description || defaultDescription}
                    </p>
                </div>

                <DialogFooter>
                    <div className="flex justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmationDialog;