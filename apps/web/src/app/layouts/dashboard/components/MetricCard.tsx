import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/util";
import {
    Clock,
    Users,
    AlertTriangle,
    DollarSign,
    Star,
    CheckSquare,
    LucideIcon,
    TrendingUp,
    TrendingDown
} from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string;
    icon: string;
    change?: {
        value: string;
        direction: 'up' | 'down';
    };
    description?: string;
}

const MetricCard = ({
    title,
    value,
    icon,
    change,
    description
}: MetricCardProps) => {
    const getIcon = (): React.ReactNode => {
        switch (icon) {
            case 'clock':
                return <Clock className="h-5 w-5 text-emerald-500" />;
            case 'users':
                return <Users className="h-5 w-5 text-blue-500" />;
            case 'alert-triangle':
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'dollar-sign':
                return <DollarSign className="h-5 w-5 text-emerald-500" />;
            case 'star':
                return <Star className="h-5 w-5 text-blue-500" />;
            case 'check-square':
                return <CheckSquare className="h-5 w-5 text-green-500" />;
            default:
                return <div className="h-5 w-5 bg-gray-200 rounded" />;
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                        {change && (
                            <div className="flex items-center text-xs font-medium">
                                {change.direction === 'up' ? (
                                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                                )}
                                <span className={cn(
                                    change.direction === 'up' ? "text-green-500" : "text-red-500"
                                )}>
                                    {change.value}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-lg font-bold">{value}</p>
                    {description && <p className="text-xs text-gray-500">{description}</p>}
                </div>
            </div>
        </Card>
    );
};

export default MetricCard;