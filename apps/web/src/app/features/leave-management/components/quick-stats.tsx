// QuickStats.tsx
"use client";

import React from 'react';
import { LeaveStatus, LeaveTimeUnit } from '@wyecare-monorepo/shared-types';

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { Clock, Users, Calendar, FileCheck, AlertCircle } from "lucide-react";
import { useGetLeaveRequestsQuery } from '../leaveApi';

interface LeaveQuickStatsProps {
    orgId: string;
}

const LeaveQuickStats: React.FC<LeaveQuickStatsProps> = ({ orgId }) => {
    // Use the new leave management API
    const { data: leaveRequestsResponse, isLoading } = useGetLeaveRequestsQuery({
        organizationId: orgId,
        // Get all requests, we'll filter in the component
        page: 1,
        limit: 1000 // A large enough limit to get all recent requests
    }, {
        refetchOnMountOrArgChange: true,
        skip: !orgId
    });

    const leaveRequests = leaveRequestsResponse?.data || [];

    // Helper function to determine if a leave request is active for a given date
    const isLeaveActiveOnDate = (request: any, date: Date): boolean => {
        const startDate = new Date(request.startDateTime);
        const endDate = new Date(request.endDateTime);
        return (
            request.status === LeaveStatus.APPROVED &&
            date >= startDate &&
            date <= endDate
        );
    };

    // Calculate stats based on the new model
    const today = new Date();
    const stats = {
        pendingRequests: leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length || 0,
        todayAbsent: leaveRequests.filter(req => isLeaveActiveOnDate(req, today)).length || 0,
        thisWeekAbsent: (() => {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);

            return leaveRequests.filter(req => {
                const leaveStart = new Date(req.startDateTime);
                const leaveEnd = new Date(req.endDateTime);
                return (
                    req.status === LeaveStatus.APPROVED &&
                    leaveStart <= endOfWeek &&
                    leaveEnd >= startOfWeek
                );
            }).length;
        })() || 0,
        totalRequests: leaveRequests.length || 0
    };

    const statCards = [
        {
            title: 'Pending Approvals',
            value: stats.pendingRequests,
            icon: <Clock className="h-5 w-5" />,
            color: 'text-amber-500',
            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
            borderColor: 'border-amber-200 dark:border-amber-800'
        },
        {
            title: 'Out Today',
            value: stats.todayAbsent,
            icon: <Users className="h-5 w-5" />,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            borderColor: 'border-blue-200 dark:border-blue-800'
        },
        {
            title: 'Out This Week',
            value: stats.thisWeekAbsent,
            icon: <Calendar className="h-5 w-5" />,
            color: 'text-indigo-500',
            bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
            borderColor: 'border-indigo-200 dark:border-indigo-800'
        },
        {
            title: 'Total Leave Requests',
            value: stats.totalRequests,
            icon: <FileCheck className="h-5 w-5" />,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
            borderColor: 'border-emerald-200 dark:border-emerald-800'
        }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((index) => (
                    <Card key={index} className="border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-12 w-12" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
                <Card
                    key={index}
                    className={`border ${stat.borderColor} shadow-sm ${stat.bgColor} hover:shadow-md transition-shadow`}
                >
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="text-3xl font-bold tracking-tight">
                                    <span className={`${stat.color}`}>{stat.value}</span>
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </div>
                            </div>
                            <div className={`p-2 rounded-full bg-white/80 dark:bg-gray-800/50 ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>

                        {stat.title === 'Pending Approvals' && stat.value > 0 && (
                            <div className="mt-4 flex items-center text-amber-600 text-xs font-medium">
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                <span>Needs attention</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default LeaveQuickStats;