import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/util";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    date?: Date;
    onSelect: (date?: Date) => void;
    placeholder?: string;
    disabled?: boolean;
    disabledDates?: (date: Date) => boolean;
    className?: string;
    fromYear?: number;
    toYear?: number;
}

const DatePicker: React.FC<DatePickerProps> = ({
    date,
    onSelect,
    placeholder = "Select date",
    disabled = false,
    disabledDates,
    className,
    fromYear = 1900,
    toYear = new Date().getFullYear(),
}) => {
    const handleSelect = (selectedDate: Date | undefined) => {
        onSelect(selectedDate);
    };

    // Default disabled dates function if none provided
    const defaultDisabledDates = (date: Date) =>
        date > new Date() || date < new Date(`${fromYear}-01-01`);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    disabled={disabledDates || defaultDisabledDates}
                    captionLayout="dropdown"
                    fromYear={fromYear}
                    toYear={toYear}
                    classNames={{
                        day_hidden: "invisible",
                        dropdown: "px-2 py-1.5 rounded-md bg-popover text-popover-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                        caption_dropdowns: "flex gap-3",
                        vhidden: "hidden",
                        caption_label: "hidden",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
};

export { DatePicker };