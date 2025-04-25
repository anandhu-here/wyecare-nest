import React from 'react';
import {
    Briefcase,
    CheckCircle,
    Clock,
    CalendarDays,
    Sofa,
    TrendingUp,
    TrendingDown,
    Users,
    UserCheck,
    BarChart3,
    Building2
} from 'lucide-react';

// Import shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from '../../hook/media-query';
import { useSelector } from 'react-redux';
import { selectSelectedDay, selectSelectedMonth, selectSelectedYear } from '@/app/features/shift/calendarSlice';
import { selectUser } from '@/app/features/auth/AuthSlice';
import { formatNumberValue } from '@/lib/util';
import { useGetQuickStatsQuery } from '@/app/features/shift/shiftApi';

// Loading component
const StatsLoader = () => (
    <div className="w-full grid grid-cols-2 md:grid-cols-12 gap-2">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="col-span-1 md:col-span-6 lg:col-span-3">
                <Card className="h-24 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800"></Card>
            </div>
        ))}
    </div>
);

interface QuickStatCardProps {
    label: string;
    value: number | string;
    icon: any;
    iconColor?: string;
    bgColor?: string;
    subtitle?: string;
    trend?: number;
    trendLabel?: string;
    previousValue?: number;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
    label,
    value,
    icon: Icon,
    iconColor = '#6366F1',
    bgColor = 'rgba(99, 102, 241, 0.1)',
    subtitle,
    trend,
    trendLabel,
    previousValue,
}) => {
    // Determine trend icon and color
    const getTrendIcon = (trend: number | null) => {
        if (trend === null || trend === undefined) return null;
        return trend > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
        ) : (
            <TrendingDown className="w-3.5 h-3.5" />
        );
    };


    const {
        isMobile
    } = useMediaQuery();

    const getTrendColor = (trend: number | null) => {
        if (trend === null || trend === undefined) return "bg-gray-200 text-gray-700";
        return trend > 0
            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    };

    return (
        <Card className="rounded-2xl p-0 overflow-hidden
                    shadow-lg shadow-gray-300/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5
                    transition-all duration-200 ease-out
                    border border-gray-100 dark:border-gray-700
                    bg-white dark:bg-gray-800
                    h-full">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Icon and label */}
                    <div className="flex items-center gap-3">
                        <div
                            className="rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: bgColor }}
                        >
                            <Icon size={18} className="stroke-2" style={{ color: iconColor }} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</p>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                                {typeof value === 'number' ? value?.toLocaleString() : value}
                            </h3>
                        </div>
                    </div>

                    {/* Right side - Trend badge */}
                    {trend !== null && trend !== undefined && !isMobile && (
                        <div className={`flex  items-center gap-1 px-2 py-1 rounded-lg ${getTrendColor(trend)}`}>
                            {getTrendIcon(trend)}
                            <span className="text-xs font-semibold">{trend !== null ? `${Math.abs(trend)}%` : ''}</span>
                        </div>
                    )}
                </div>

                {/* Subtitle row */}
                {subtitle && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

// Color configurations with gradient support
const colorConfigs = {
    home: {
        'Total Shifts': {
            icon: '#7c6bb5',
            bg: 'rgba(124, 107, 181, 0.15)',
        },
        'Internal Shifts': {
            icon: '#10B981',
            bg: 'rgba(16, 185, 129, 0.15)',
        },
        'Agency Shifts': {
            icon: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.15)',
        },
        'Completion Rate': {
            icon: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.15)',
        }
    },
    agency: {
        'Total Staff': {
            icon: '#7c6bb5',
            bg: 'rgba(124, 107, 181, 0.15)',
        },
        'Assignments': {
            icon: '#10B981',
            bg: 'rgba(16, 185, 129, 0.15)',
        },
        'Completion Rate': {
            icon: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.15)',
        },
        'Rating': {
            icon: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.15)',
        }
    },
    staff: {
        'Total Shifts': {
            icon: '#7c6bb5',
            bg: 'rgba(124, 107, 181, 0.15)',
        },
        'Completed': {
            icon: '#10B981',
            bg: 'rgba(16, 185, 129, 0.15)',
        },
        'Pending': {
            icon: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.15)',
        },
        'Rating': {
            icon: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.15)',
        }
    }
};

// Icon maps
const iconMaps = {
    home: {
        'Total Shifts': Briefcase,
        'Internal Shifts': UserCheck,
        'Agency Shifts': Building2,
        'Completion Rate': BarChart3
    },
    agency: {
        'Total Staff': Users,
        'Assignments': Briefcase,
        'Completion Rate': BarChart3,
        'Rating': CheckCircle
    },
    staff: {
        'Total Shifts': Briefcase,
        'Completed': CheckCircle,
        'Pending': Clock,
        'Rating': BarChart3
    }
};

interface QuickStatsProps {
    type: 'home' | 'agency' | 'staff';
}

const QuickStats: React.FC<QuickStatsProps> = ({ type }) => {
    // const {
    //     selectedMonth,
    //     selectedYear
    // } = useSelector(selectTime);

    const selectedDay = useSelector(selectSelectedDay);
    const selectedMonth = useSelector(selectSelectedMonth);
    const selectedYear = useSelector(selectSelectedYear);

    const user = useSelector(selectUser);

    const {
        data: quickStatsData,
        isLoading: isQuickStatsLoading
    } = useGetQuickStatsQuery({
        month: selectedMonth,
        year: selectedYear
    }, {
        skip: !user?._id,
        refetchOnMountOrArgChange: true
    });

    if (isQuickStatsLoading) {
        return <StatsLoader />;
    }

    const getQuickStatsConfig = () => {
        switch (type) {
            case 'home':
                return {
                    colors: colorConfigs.home,
                    iconMap: iconMaps.home,
                    metrics: [
                        {
                            label: 'Total Shifts',
                            value: formatNumberValue(quickStatsData?.data?.overall.totalShifts),
                            trend: formatNumberValue(quickStatsData?.data?.overall.monthOverMonthGrowth),
                            subtitle: `Previous month: ${formatNumberValue(quickStatsData?.data?.previousMonth.total)}`
                        },
                        {
                            label: 'Internal Shifts',
                            value: formatNumberValue(quickStatsData?.data?.internal.total),
                            trend: formatNumberValue(quickStatsData?.data?.internal.completed / quickStatsData?.data?.internal.total),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.internal.completed)} completed`
                        },
                        {
                            label: 'Agency Shifts',
                            value: formatNumberValue(quickStatsData?.data?.agency.total),
                            trend: formatNumberValue(quickStatsData?.data?.agency.completed / quickStatsData?.data?.agency.total),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.agency.completed)} completed`
                        },
                        {
                            label: 'Completion Rate',
                            value: `${formatNumberValue(quickStatsData?.data?.overall.utilizationRate)}%`,
                            trend: formatNumberValue(quickStatsData?.data?.overall.completionTrend),
                            subtitle: `Weekly average: ${formatNumberValue(quickStatsData?.data?.overall.weeklyAverage)} shifts`
                        }
                    ]
                };
            case 'agency':
                return {
                    colors: colorConfigs.agency,
                    iconMap: iconMaps.agency,
                    metrics: [
                        {
                            label: 'Total Staff',
                            value: formatNumberValue(quickStatsData?.data?.staff.total),
                            trend: formatNumberValue(quickStatsData?.data?.staff.utilization),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.staff.active)} currently active`
                        },
                        {
                            label: 'Assignments',
                            value: formatNumberValue(quickStatsData?.data?.overall.totalAssignments),
                            trend: formatNumberValue(quickStatsData?.data?.overall.monthOverMonthGrowth),
                            subtitle: `Previous month: ${formatNumberValue(quickStatsData?.data?.previousMonth.totalAssignments)}`
                        },
                        {
                            label: 'Completion Rate',
                            value: `${formatNumberValue(quickStatsData?.data?.performance.completionRate)}%`,
                            trend: formatNumberValue(quickStatsData?.data?.overall.completionTrend),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.overall.completedAssignments)} completed, ${formatNumberValue(quickStatsData?.data?.overall.pendingAssignments)} pending`
                        },
                        {
                            label: 'Rating',
                            value: quickStatsData?.data?.performance.rating ? formatNumberValue(quickStatsData?.data?.performance.rating) : 'N/A',
                            trend: null,
                            subtitle: `Weekly average: ${formatNumberValue(quickStatsData?.data?.overall.weeklyAverage)} assignments`
                        }
                    ]
                };
            case 'staff':
                return {
                    colors: colorConfigs.staff,
                    iconMap: iconMaps.staff,
                    metrics: [
                        {
                            label: 'Total Shifts',
                            value: formatNumberValue(quickStatsData?.data?.overall.totalShifts),
                            trend: formatNumberValue(quickStatsData?.data?.overall.monthOverMonthGrowth),
                            subtitle: `Previous month: ${formatNumberValue(quickStatsData?.data?.previousMonth.totalShifts)}`
                        },
                        {
                            label: 'Completed',
                            value: formatNumberValue(quickStatsData?.data?.overall.completedShifts),
                            trend: formatNumberValue(quickStatsData?.data?.overall.completionRate),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.overall.weeklyAverage)} shifts per week`
                        },
                        {
                            label: 'Pending',
                            value: formatNumberValue(quickStatsData?.data?.overall.pendingShifts),
                            trend: formatNumberValue(quickStatsData?.data?.overall.completionTrend),
                            subtitle: `${formatNumberValue(quickStatsData?.data?.performance.completionRate)}% completion rate`
                        },
                        {
                            label: 'Rating',
                            value: quickStatsData?.data?.performance.rating ? formatNumberValue(quickStatsData?.data?.performance.rating) : 'N/A',
                            trend: null,
                            subtitle: `Based on completed shifts`
                        }
                    ]
                };
            default:
                return {
                    colors: {},
                    iconMap: {},
                    metrics: []
                };
        }
    };

    const config = getQuickStatsConfig();

    return (
        <div className="w-full grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4">
            {config.metrics.map((stat, index) => (
                <div key={index} className="col-span-1 md:col-span-6 lg:col-span-3">
                    <QuickStatCard
                        label={stat.label}
                        value={stat.value}
                        icon={config.iconMap[stat.label] || Sofa}
                        iconColor={config.colors[stat.label]?.icon}
                        bgColor={config.colors[stat.label]?.bg}
                        subtitle={stat.subtitle}
                        trend={stat.trend}
                        trendLabel={stat.trendLabel}
                        previousValue={stat.previousValue}
                    />
                </div>
            ))}
        </div>
    );
};

export { QuickStats };