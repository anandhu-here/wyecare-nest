'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CheckIcon,
    Loader2,
    RefreshCcw,
    Search,
    XIcon,
    UserIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAvailableStaffForShiftQuery } from '../../organization/organizationApi';

// StaffCard Component
const StaffCard = ({ staff, isSelected, onToggle, disabled }: {
    staff: any;
    isSelected: boolean;
    onToggle: () => void;
    disabled?: boolean;
}) => {
    const { isAvailable, isOnLeave } = staff.availability || {
        isAvailable: true,
        isOnLeave: false,
    };

    const handleCardClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            onToggle();
        }
    };

    return (
        <div
            onClick={handleCardClick}
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
                            ? staff.availability?.reason || 'Not Available'
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
                    {staff.user?.avatarUrl ? (
                        <img
                            src={staff.user?.avatarUrl}
                            alt={`${staff.user?.firstName} ${staff.user?.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 text-sm font-medium">
                                {staff.user?.firstName?.[0]}
                                {staff.user?.lastName?.[0]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {staff.user?.firstName} {staff.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                        {staff.role}{' '}
                        {staff.specializations?.length > 0 &&
                            `• ${staff.specializations.join(', ')}`}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Search and Filter Component
const SearchAndFilter = ({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    roleFilter: string;
    onRoleFilterChange: (value: string) => void;
}) => (
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

interface AssignStaffDialogProps {
    open: boolean;
    onClose: () => void;
    selectedStaff: string[];
    maxSelections: number;
    onConfirm: (selected: string[]) => void;
    shiftDetails: {
        date: string;
        careHomeId: string;
        shiftPatternId: string;
    };
}

const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({
    open,
    onClose,
    selectedStaff = [],
    onConfirm,
    maxSelections,
    shiftDetails,
}) => {
    const [selected, setSelected] = useState<string[]>(selectedStaff);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Sync dialog open state with props
    useEffect(() => {
        if (open) {
            setIsDialogOpen(true);
        }
    }, [open]);

    // Handle dialog close
    const handleDialogClose = useCallback(() => {
        setIsDialogOpen(false);
        onClose();
    }, [onClose]);

    const {
        data: availableStaffResponse,
        isLoading,
        isError,
        refetch: refetchAvailableStaff,
    } = useGetAvailableStaffForShiftQuery(
        {
            shiftDate: shiftDetails.date,
            careHomeId: shiftDetails.careHomeId,
            shiftPatternId: shiftDetails.shiftPatternId,
        },
        {
            skip: !open,
            refetchOnMountOrArgChange: true,
        }
    );

    // Reset selected staff when dialog opens
    useEffect(() => {
        if (open) {
            setSelected(selectedStaff);
        }
    }, [open, selectedStaff]);

    const filteredStaff = useMemo(() => {
        if (!availableStaffResponse?.data) return [];

        return availableStaffResponse.data.filter((staff: any) => {
            const nameMatch = `${staff.user?.firstName} ${staff.user?.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const roleMatch =
                roleFilter === 'all' ||
                staff.role.toLowerCase() === roleFilter.toLowerCase();
            return nameMatch && roleMatch;
        });
    }, [availableStaffResponse?.data, searchTerm, roleFilter]);

    const handleStaffToggle = useCallback(
        (staffId: string) => {
            setSelected((prevSelected) => {
                if (prevSelected.includes(staffId)) {
                    return prevSelected.filter((id) => id !== staffId);
                } else if (prevSelected.length < maxSelections) {
                    return [...prevSelected, staffId];
                }
                return prevSelected;
            });
        },
        [maxSelections]
    );

    const handleConfirm = useCallback(() => {
        onConfirm(selected);
        handleDialogClose();
    }, [selected, onConfirm, handleDialogClose]);

    // Error state
    if (isError) {
        return (
            <Dialog
                open={isDialogOpen}
                onOpenChange={(isOpen) => !isOpen && handleDialogClose()}
            >
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
                    <DialogFooter>
                        <Button onClick={handleDialogClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleDialogClose();
                }
            }}
        >
            <DialogContent
                className="p-0 flex flex-col max-h-[90vh] [&>button:last-child]:hidden sm:max-w-[725px]"
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Assign Staff</DialogTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {selected.length} of {maxSelections} staff members selected
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="bg-primary-50 text-primary-700 border-primary-200"
                            >
                                {maxSelections - selected.length} positions remaining
                            </Badge>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    refetchAvailableStaff();
                                }}
                                className="h-8 w-8"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
                    <SearchAndFilter
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        roleFilter={roleFilter}
                        onRoleFilterChange={setRoleFilter}
                    />

                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredStaff.map((staff) => (
                                <StaffCard
                                    key={staff.user?._id}
                                    staff={staff}
                                    isSelected={selected.includes(staff.user?._id)}
                                    onToggle={() => handleStaffToggle(staff.user?._id)}
                                    disabled={
                                        !staff.availability?.isAvailable ||
                                        staff.availability?.isOnLeave ||
                                        (selected.length >= maxSelections &&
                                            !selected.includes(staff.user?._id))
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && filteredStaff.length === 0 && (
                        <div
                            className="flex flex-col items-center justify-center h-40 
              border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
                        >
                            <UserIcon className="h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                                No staff members found matching your criteria
                            </p>
                        </div>
                    )}
                </ScrollArea>

                <div className="px-6 py-4 border-t flex-shrink-0 flex justify-end space-x-3 bg-gray-50">
                    <Button
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDialogClose();
                        }}
                    >
                        <XIcon className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm();
                        }}
                        disabled={selected.length === 0}
                    >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Confirm Selection ({selected.length}/{maxSelections})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AssignStaffDialog;
