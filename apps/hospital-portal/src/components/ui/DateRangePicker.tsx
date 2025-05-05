"use client"
import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/util"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"

/**
 * DateRangePicker Component - A reusable date range picker using shadcn UI components
 * 
 * @param {object} props - Component props
 * @param {DateRange | undefined} props.value - Currently selected date range
 * @param {(range: DateRange | undefined) => void} props.onChange - Function called when date range changes
 * @param {string} props.placeholder - Placeholder text when no date is selected
 * @param {React.HTMLAttributes<HTMLDivElement>} props.className - Additional classes
 * @param {number} props.numberOfMonths - Number of months to display in the calendar (default: 2)
 */
export function DateRangePicker({
    value,
    onChange,
    placeholder = "Select date range",
    className,
    numberOfMonths = 2,
    ...props
}) {
    // Handle date formatting in the button
    const formatDateRange = (range) => {
        if (!range) return placeholder;

        if (range.from) {
            if (range.to) {
                return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
            }
            return format(range.from, "MMM dd, yyyy");
        }

        return placeholder;
    };

    return (
        <div className={cn("grid gap-2", className)} {...props}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !value?.from && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateRange(value)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={value?.from}
                        selected={value}
                        onSelect={onChange}
                        numberOfMonths={numberOfMonths}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default DateRangePicker;