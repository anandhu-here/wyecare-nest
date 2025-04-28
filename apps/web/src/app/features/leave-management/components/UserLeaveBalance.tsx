// UserLeaveBalance.tsx
"use client";

import React from 'react';
import { useGetLeaveBalanceQuery } from '../leaveApi';
import { useSelector } from 'react-redux';
import { LeaveTimeUnit } from '@wyecare-monorepo/shared-types';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { AlertCircle } from "lucide-react";
import { selectCurrentOrganization, selectUser } from '../../auth/AuthSlice';

interface UserLeaveBalanceProps { }

const UserLeaveBalance: React.FC<UserLeaveBalanceProps> = () => {
    // Get current user and organization
    const currentUser = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);

    const userId = currentUser?._id;
    const orgId = currentOrganization?._id;

    // Get leave balance data
    const { data: balanceData, isLoading } = useGetLeaveBalanceQuery(undefined, {
        refetchOnMountOrArgChange: true,
        skip: !userId || !orgId
    });

    const leaveBalance = balanceData?.data;

    // Format time unit
    const formatTimeUnit = (unit: LeaveTimeUnit) => {
        switch (unit) {
            case LeaveTimeUnit.DAYS:
                return 'days';
            case LeaveTimeUnit.HOURS:
                return 'hours';
            case LeaveTimeUnit.WEEKS:
                return 'weeks';
            default:
                return unit.toLowerCase();
        }
    };

    // Calculate progress percentage
    const calculateProgressPercentage = (used: number, total: number) => {
        if (total === 0) return 0;
        return Math.min(Math.round((used / total) * 100), 100);
    };

    // Get color based on remaining balance percentage
    const getProgressColor = (used: number, total: number) => {
        const percentage = calculateProgressPercentage(used, total);
        if (percentage >= 90) return "bg-red-600";
        if (percentage >= 70) return "bg-yellow-500";
        return "bg-green-600";
    };

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // If no balance data or no leave types
    if (!leaveBalance || Object.keys(leaveBalance.balances).length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <h3 className="font-medium">No leave balance available</h3>
                        <p className="text-sm mt-1">
                            Your leave entitlements haven't been set up yet
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Your Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(leaveBalance.balances).map(([leaveType, balance]) => {
                        // Get default time unit for this balance
                        const timeUnit = Object.keys(balance.allocations)[0] as LeaveTimeUnit;

                        // Get allocation and used values in the same unit
                        const allocation = balance.allocations[timeUnit] || 0;
                        const used = balance.used[timeUnit] || 0;
                        const pending = balance.pending[timeUnit] || 0;

                        // Calculate remaining and percentage
                        const remaining = allocation - used - pending;
                        const progressPercentage = calculateProgressPercentage(used + pending, allocation);
                        const progressColor = getProgressColor(used + pending, allocation);

                        return (
                            <div key={leaveType} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="font-medium">{leaveType}</span>
                                        {pending > 0 && (
                                            <span className="text-amber-600 text-xs ml-2">
                                                ({pending} pending)
                                            </span>
                                        )}
                                    </div>
                                    <span>
                                        {remaining} of {allocation} {formatTimeUnit(timeUnit)} remaining
                                    </span>
                                </div>
                                <Progress
                                    value={progressPercentage}
                                    className="h-2"
                                    indicatorClassName={progressColor}
                                />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default UserLeaveBalance;