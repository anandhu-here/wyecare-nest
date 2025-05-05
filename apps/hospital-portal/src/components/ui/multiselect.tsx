"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/util';

interface Option {
    _id: string;
    name: string;
    isTemporary?: boolean;
}

interface MultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    value = [],
    onChange,
    placeholder = "Select items...",
    disabled = false,
    error,
    className
}) => {
    const [open, setOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>(value || []);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Sync with external value when it changes
    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    // Handle selecting an option
    const handleSelect = (optionId: string) => {
        let newSelectedValues;

        if (selectedValues.includes(optionId)) {
            // If already selected, remove it
            newSelectedValues = selectedValues.filter(val => val !== optionId);
        } else {
            // Otherwise add it
            newSelectedValues = [...selectedValues, optionId];
        }

        setSelectedValues(newSelectedValues);
        onChange(newSelectedValues);
    };

    // Handle removing a selected option
    const handleRemove = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelectedValues = selectedValues.filter(val => val !== optionId);
        setSelectedValues(newSelectedValues);
        onChange(newSelectedValues);
    };

    // Find option by its ID
    const getOptionById = (id: string) => {
        return options.find(option => option._id === id);
    };

    return (
        <div className="w-full">
            <Popover open={open && !disabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div
                        ref={triggerRef}
                        className={cn(
                            "flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                            "focus-visible:ring-ring focus-visible:ring-offset-2",
                            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                            error ? "border-destructive" : "",
                            className
                        )}
                        onClick={() => !disabled && setOpen(true)}
                    >
                        <div className="flex flex-wrap gap-1 items-center">
                            {selectedValues.length === 0 && (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}

                            {selectedValues.map(val => {
                                const option = getOptionById(val);
                                return option ? (
                                    <Badge
                                        key={val}
                                        variant="secondary"
                                        className="flex items-center gap-1 text-xs"
                                    >
                                        {option.name}
                                        {!disabled && (
                                            <X
                                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                onClick={(e) => handleRemove(val, e)}
                                            />
                                        )}
                                    </Badge>
                                ) : null;
                            })}
                        </div>

                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </PopoverTrigger>

                <PopoverContent className="w-full p-0" align="start" style={{ width: triggerRef.current?.offsetWidth }}>
                    <Command>
                        <CommandInput placeholder="Search options..." className="h-9" />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option._id}
                                        value={option._id}
                                        onSelect={() => handleSelect(option._id)}
                                    >
                                        <div className="flex items-center">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedValues.includes(option._id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span>{option.name}</span>
                                            {option.isTemporary && (
                                                <Badge variant="outline" className="ml-2 text-xs">Temporary</Badge>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    );
};