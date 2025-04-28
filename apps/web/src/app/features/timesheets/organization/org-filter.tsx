import React, { useState, useEffect } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// shadcn components
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/util';

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    filterOptions: {
        organizationId: string;
        careUserId: string;
        startDate: Date;
        endDate: Date;
        shiftPatternId: string;
        status: string;
        invoiceStatus: string;
        isEmergency: boolean | null;
        carerRole: string;
    };
    onFilterChange: (field: string, value: any) => void;
    onReset: () => void;
    organizations: Array<{ _id: string; name: string }>;
    careStaffs: Array<{ user: { _id: string; firstName: string; lastName: string } }>;
    shiftPatterns: Array<{ _id: string; name: string }>;
    otherShiftPatterns: Array<{ _id: string; name: string }>;
}

const TIMESHEET_STATUSES = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
];

const INVOICE_STATUSES = [
    { value: 'all', label: 'All Invoice Statuses' },
    { value: 'pending_invoice', label: 'Pending Invoice' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'paid', label: 'Paid' },
    { value: 'approved', label: 'Approved' }
];

const CARER_ROLES = [
    { value: 'all', label: 'All Roles' },
    { value: 'carer', label: 'Carer' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'senior_carer', label: 'Senior Carer' }
];

export const FilterModal: React.FC<FilterModalProps> = ({
    open,
    onClose,
    filterOptions,
    onFilterChange,
    onReset,
    organizations,
    careStaffs,
    shiftPatterns,
    otherShiftPatterns
}) => {
    // State for date range picker
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filterOptions.startDate,
        to: filterOptions.endDate
    });

    // Update date range when filter options change
    useEffect(() => {
        if (filterOptions.startDate || filterOptions.endDate) {
            setDateRange({
                from: filterOptions.startDate,
                to: filterOptions.endDate
            });
        }
    }, [filterOptions.startDate, filterOptions.endDate]);

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);

        if (range?.from) {
            onFilterChange('startDate', range.from);
        }

        if (range?.to) {
            onFilterChange('endDate', range.to);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] flex flex-col w-full p-3">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Advanced Filters</DialogTitle>
                </DialogHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto ">
                    <div className="space-y-6 px-1">
                        {/* Main Status Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Timesheet Status */}
                            <div className="space-y-2">
                                <Label htmlFor="timesheet-status">Timesheet Status</Label>
                                <Select
                                    value={filterOptions.status}
                                    onValueChange={(value) => onFilterChange('status', value)}
                                >
                                    <SelectTrigger id="timesheet-status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMESHEET_STATUSES.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Invoice Status */}
                            <div className="space-y-2">
                                <Label htmlFor="invoice-status">Invoice Status</Label>
                                <Select
                                    value={filterOptions.invoiceStatus}
                                    onValueChange={(value) => onFilterChange('invoiceStatus', value)}
                                >
                                    <SelectTrigger id="invoice-status">
                                        <SelectValue placeholder="Select invoice status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INVOICE_STATUSES.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Role and Emergency Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Carer Role */}
                            <div className="space-y-2">
                                <Label htmlFor="staff-role">Staff Role</Label>
                                <Select
                                    value={filterOptions.carerRole}
                                    onValueChange={(value) => onFilterChange('carerRole', value)}
                                >
                                    <SelectTrigger id="staff-role">
                                        <SelectValue placeholder="Select staff role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CARER_ROLES.map(role => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Emergency Filter */}
                            <div className="space-y-2">
                                <Label htmlFor="emergency-shifts">Emergency Shifts</Label>
                                <Select
                                    value={filterOptions?.isEmergency === null ? 'all' : filterOptions?.isEmergency?.toString()}
                                    onValueChange={(value) => {
                                        onFilterChange('isEmergency',
                                            value === 'all' ? null : value === 'true'
                                        );
                                    }}
                                >
                                    <SelectTrigger id="emergency-shifts">
                                        <SelectValue placeholder="Select shift type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Shifts</SelectItem>
                                        <SelectItem value="true">Emergency Only</SelectItem>
                                        <SelectItem value="false">Non-Emergency Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Organization Select */}
                        <div className="space-y-2">
                            <Label htmlFor="organization">Organization</Label>
                            <Select
                                value={filterOptions.organizationId}
                                onValueChange={(value) => onFilterChange('organizationId', value)}
                            >
                                <SelectTrigger id="organization">
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Organizations</SelectItem>
                                    {organizations.map((org) => (
                                        <SelectItem key={org._id} value={org._id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range with shadcn Calendar */}
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Select date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={handleDateRangeChange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateRange && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 text-xs"
                                    onClick={() => {
                                        setDateRange(undefined);
                                        onFilterChange('startDate', null);
                                        onFilterChange('endDate', null);
                                    }}
                                >
                                    Clear dates
                                </Button>
                            )}
                        </div>

                        {/* Care Staff */}
                        <div className="space-y-2">
                            <Label htmlFor="care-staff">Care Staff</Label>
                            <Select
                                value={filterOptions.careUserId}
                                onValueChange={(value) => onFilterChange('careUserId', value)}
                            >
                                <SelectTrigger id="care-staff">
                                    <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Staff</SelectItem>
                                    {careStaffs.map((staff) => (
                                        <SelectItem key={staff.user._id} value={staff.user._id}>
                                            {staff.user.firstName} {staff.user.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Shift Pattern */}
                        <div className="space-y-2">
                            <Label htmlFor="shift-pattern">Shift Pattern</Label>
                            <Select
                                value={filterOptions.shiftPatternId}
                                onValueChange={(value) => onFilterChange('shiftPatternId', value)}
                            >
                                <SelectTrigger id="shift-pattern">
                                    <SelectValue placeholder="Select shift pattern" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Patterns</SelectItem>
                                    {otherShiftPatterns && otherShiftPatterns.length > 0 ? (
                                        otherShiftPatterns.map((pattern) => (
                                            <SelectItem key={pattern._id} value={pattern._id}>
                                                {pattern.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        shiftPatterns.map((pattern) => (
                                            <SelectItem key={pattern._id} value={pattern._id}>
                                                {pattern.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={onReset}>
                        Reset Filters
                    </Button>
                    <Button onClick={onClose}>
                        Apply Filters
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FilterModal;