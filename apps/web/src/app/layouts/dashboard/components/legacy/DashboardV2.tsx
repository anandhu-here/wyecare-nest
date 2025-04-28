import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useDarkMode } from 'usehooks-ts';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';
import { selectSelectedDay, selectSelectedMonth, selectSelectedYear } from '@/app/features/shift/calendarSlice';
import { selectCurrentOrganization, selectUser } from '@/app/features/auth/AuthSlice';
import { useGetAnalyticsByRoleQuery } from '@/app/features/shift/shiftAnalyticApi';
import { renderStaffAnalytics } from './views/renderStaffs';
import { renderAgencyAnalytics } from './views/renderAgency';
import { renderHomeAnalytics } from './views/renderHome';


const colorMap = {
    primary: {
        icon: '#7c6bb5', // Purple-blue
        bg: 'rgba(124, 107, 181, 0.15)'
    },
    secondary: {
        icon: '#8B5CF6', // Purple
        bg: 'rgba(139, 92, 246, 0.15)'
    },
    success: {
        icon: '#10B981', // Green
        bg: 'rgba(16, 185, 129, 0.15)'
    },
    warning: {
        icon: '#F59E0B', // Amber
        bg: 'rgba(245, 158, 11, 0.15)'
    },
    error: {
        icon: '#EF4444', // Red
        bg: 'rgba(239, 68, 68, 0.15)'
    },
    info: {
        icon: '#3B82F6', // Blue
        bg: 'rgba(59, 130, 246, 0.15)'
    },
    default: {
        icon: '#6B7280', // Gray
        bg: 'rgba(107, 114, 128, 0.15)'
    },
    violet: {
        icon: '#8B5CF6', // Violet
        bg: 'rgba(139, 92, 246, 0.15)'
    },
    indigo: {
        icon: '#6366F1', // Indigo
        bg: 'rgba(99, 102, 241, 0.15)'
    },
    teal: {
        icon: '#14B8A6', // Teal
        bg: 'rgba(20, 184, 166, 0.15)'
    }
};
export const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'primary',
    tooltip
}: any) => {
    // Format trend display
    const getTrendDisplay = (trend: any) => {
        if (trend === null || trend === undefined) return null;

        const isPositive = trend >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        const trendColor = isPositive
            ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
            : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';

        return (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
        );
    };

    const CardComponent = (
        <Card className="h-36 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start gap-3">
                    <div
                        className={`rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 ${colorMap[color].bg}`}
                    >
                        <Icon className={`stroke-2 w-5 h-5 ${colorMap[color].icon}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5 truncate">{title}</p>
                        <h3 className="text-lg font-bold text-foreground leading-tight truncate">
                            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
                        </h3>
                    </div>
                </div>

                {trend !== undefined && (
                    <div className="mt-2 flex justify-start">
                        {getTrendDisplay(trend)}
                    </div>
                )}

                <CardFooter className="mt-auto px-0 pb-0 pt-2">
                    {subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {subtitle}
                        </p>
                    )}
                </CardFooter>
            </CardContent>
        </Card>
    );

    // If tooltip is provided, wrap with Tooltip component
    if (tooltip) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        {CardComponent}
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3 text-sm" side="top" align="start">
                        {tooltip}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Without tooltip
    return CardComponent;
};

export const ChartCard = ({ title, subtitle, height = 350, children }: any) => (
    <Card className="overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 h-auto">
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
            <div>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {title}
                </CardTitle>
                {subtitle && (
                    <CardDescription className="text-xs mt-1">
                        {subtitle}
                    </CardDescription>
                )}
            </div>

            <Badge variant="outline" className="bg-primary/5 text-xs font-normal">
                Last 30 days
            </Badge>
        </CardHeader>
        <CardContent className="p-0">
            <div style={{ height: height - 80 }} className="p-4 pt-0">
                {children}
            </div>
        </CardContent>
    </Card>
);


export const RelationCard = ({ title, data, renderItem }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6">
            <h6 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
                {title}
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {data?.map((item: any, index: React.Key | null | undefined) => (
                    <div key={index}>
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    </div>
);



const AnalyticsDashboard: React.FC<any> = () => {
    const selectedDay = useSelector(selectSelectedDay);
    const selectedMonth = useSelector(selectSelectedMonth);
    const selectedYear = useSelector(selectSelectedYear);

    const user = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);

    const { isDarkMode } = useDarkMode();

    const getMonthDateRange = useMemo(() => {
        const month = selectedMonth - 1;
        const startDate = new Date(selectedYear, month, 1);
        const endDate = new Date(selectedYear, month + 1, 0);

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            period: 'month' as const
        };
    }, [selectedMonth, selectedYear]);

    const { data: analyticsData, isLoading, error } = useGetAnalyticsByRoleQuery(getMonthDateRange, {
        refetchOnMountOrArgChange: true
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="m-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                Failed to load analytics data
            </div>
        );
    }

    const renderContent = () => {
        if (!analyticsData) return null;


        // Staff view
        if (['carer', 'nurse', 'senior_carer'].includes(user?.role ?? '')) {
            return renderStaffAnalytics(analyticsData?.data, isDarkMode);
        }

        // Agency view
        if (currentOrganization?.type === 'agency') {
            return renderAgencyAnalytics(analyticsData?.data, isDarkMode);
        }

        // Home view
        if (currentOrganization?.type === 'home') {
            return renderHomeAnalytics(analyticsData?.data, isDarkMode);
        }

        return (
            <div className="m-4 p-4 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                No analytics available for your role.
            </div>
        );
    };

    return (
        <div className="p-0">
            {renderContent()}
        </div>
    );
};

export default AnalyticsDashboard;