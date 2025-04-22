import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/util";
import {
    Library,
    User,
    Building2,
    BarChart4,
    LucideIcon
} from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    icon: string;
    change?: {
        value: string;
        direction: 'up' | 'down';
    };
    previousValue?: string;
    secondaryText?: string;
}

const StatCard = ({
    title,
    value,
    icon,
    change,
    previousValue,
    secondaryText
}: StatCardProps) => {
    const getIcon = (): React.ReactNode => {
        switch (icon) {
            case 'library':
                return <Library className="h-5 w-5 text-indigo-500" />;
            case 'user':
                return <User className="h-5 w-5 text-emerald-500" />;
            case 'building':
                return <Building2 className="h-5 w-5 text-amber-500" />;
            case 'bar-chart':
                return <BarChart4 className="h-5 w-5 text-blue-500" />;
            default:
                return <div className="h-5 w-5 bg-gray-200 rounded" />;
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    {getIcon()}
                </div>
                {change && (
                    <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        change.direction === 'up'
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                        {change.value}
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                <p className="text-xl font-bold">{value}</p>
                {previousValue && <p className="text-xs text-gray-500">{previousValue}</p>}
                {secondaryText && <p className="text-xs text-gray-500">{secondaryText}</p>}
            </div>
        </Card>
    );
};

export default StatCard;