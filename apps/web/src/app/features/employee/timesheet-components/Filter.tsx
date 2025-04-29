import React, { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    filterOptions: {
        status: string;
        dateRange: {
            from: Date;
            to: Date;
        };
    };
    onFilterChange: (field: string, value: any) => void;
    onReset: () => void;
    onCalculate: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    open,
    onClose,
    filterOptions,
    onFilterChange,
    onReset,
    onCalculate
}) => {
    const [activeTab, setActiveTab] = useState("filter");

    // Date presets
    const dateRangePresets = [
        {
            label: "Today",
            value: "today",
            dateRange: {
                from: new Date(),
                to: new Date()
            }
        },
        {
            label: "This Week",
            value: "this-week",
            dateRange: {
                from: startOfWeek(new Date(), { weekStartsOn: 1 }),
                to: endOfWeek(new Date(), { weekStartsOn: 1 })
            }
        },
        {
            label: "Last 2 Weeks",
            value: "last-2-weeks",
            dateRange: {
                from: startOfWeek(addDays(new Date(), -7), { weekStartsOn: 1 }),
                to: endOfWeek(new Date(), { weekStartsOn: 1 })
            }
        },
        {
            label: "This Month",
            value: "this-month",
            dateRange: {
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date())
            }
        },
        {
            label: "Last 3 Months",
            value: "last-3-months",
            dateRange: {
                from: startOfMonth(addDays(new Date(), -90)),
                to: endOfMonth(new Date())
            }
        },
        {
            label: "Last 6 Months",
            value: "last-6-months",
            dateRange: {
                from: startOfMonth(addDays(new Date(), -180)),
                to: endOfMonth(new Date())
            }
        },
    ];

    // Handle apply filters
    const handleApplyFilters = () => {
        onClose();
    };

    // Handle preset selection
    const handlePresetSelect = (value: string) => {
        const preset = dateRangePresets.find(preset => preset.value === value);
        if (preset) {
            onFilterChange("dateRange", preset.dateRange);
        }
    };

    // Handle calculating summary
    const handleCalculateSummary = () => {
        onCalculate();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] md:w-[500px] rounded-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Timesheet Management</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="filter" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="filter">Filter Timesheets</TabsTrigger>
                        <TabsTrigger value="summary">Calculate Summary</TabsTrigger>
                    </TabsList>

                    {/* Filter Tab Content */}
                    <TabsContent value="filter" className="space-y-6">
                        {/* Status Filter - Only in Filter tab */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={filterOptions.status}
                                onValueChange={(value) => onFilterChange('status', value)}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range with Presets */}
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Select onValueChange={handlePresetSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {dateRangePresets.map((preset) => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 flex justify-between gap-2">
                            <Button variant="outline" onClick={onReset} className="flex-1">
                                Reset
                            </Button>
                            <Button onClick={handleApplyFilters} className="flex-1">
                                Apply Filters
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Summary Tab Content */}
                    <TabsContent value="summary" className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Calculate a summary of approved timesheets within the selected date range.
                            </p>
                        </div>

                        {/* Date Range with Presets - Also needed in Summary tab */}
                        <div className="space-y-2">
                            <Label>Date Range for Summary</Label>
                            <Select onValueChange={handlePresetSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {dateRangePresets.map((preset) => (
                                        <SelectItem key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selected Date Range Display */}
                        <div className="rounded-md border p-3 bg-muted/30">
                            <div className="text-sm">
                                <div className="font-medium">Selected Period:</div>
                                <div>
                                    {filterOptions.dateRange.from && filterOptions.dateRange.to ? (
                                        <>
                                            {format(filterOptions.dateRange.from, "PP")} - {format(filterOptions.dateRange.to, "PP")}
                                        </>
                                    ) : (
                                        "No date range selected"
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="default"
                                onClick={handleCalculateSummary}
                                className="w-full"
                            >
                                Calculate Summary
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default FilterModal;