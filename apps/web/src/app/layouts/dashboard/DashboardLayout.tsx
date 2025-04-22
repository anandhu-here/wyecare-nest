import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import StatCard from './components/StatCard';
import ChartCard from './components/ChartCard';
import CalendarCard from './components/CalendarCard';
import MetricCard from './components/MetricCard';

interface DashboardLayoutProps {
    children?: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    // Current month and year for the calendar header
    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="mx-auto p-4 space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Shifts"
                    value="0"
                    icon="library"
                    change={{ value: "100%", direction: "down" }}
                    previousValue="Previous month: 41"
                />
                <StatCard
                    title="Internal Shifts"
                    value="0"
                    icon="user"
                    change={{ value: "NaN%", direction: "down" }}
                    secondaryText="0 completed"
                />
                <StatCard
                    title="Agency Shifts"
                    value="0"
                    icon="building"
                    change={{ value: "NaN%", direction: "down" }}
                    secondaryText="0 completed"
                />
                <StatCard
                    title="Completion Rate"
                    value="0%"
                    icon="bar-chart"
                    change={{ value: "0%", direction: "down" }}
                    secondaryText="Weekly average: 0 shifts"
                />
            </div>

            {/* Calendar and Quick Stats Row - Side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Calendar - Takes 2/3 width on desktop */}
                <div className="lg:col-span-2">
                    <CalendarCard />
                </div>

                {/* Quick Stats - Takes 1/3 width on desktop */}
                <div className="space-y-4">
                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Open Shifts</span>
                                <span className="font-medium">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Filled Shifts</span>
                                <span className="font-medium">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Upcoming Shifts</span>
                                <span className="font-medium">0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Late Check-ins</span>
                                <span className="text-red-500 font-medium">0</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Today's Activity</h3>
                        <div className="text-center py-6 text-gray-500">
                            <p>No shifts scheduled for today</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Chart and Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="col-span-1 lg:col-span-2">
                    <ChartCard
                        title="Shift Distribution"
                        subtitle="Last 30 days"
                    />
                </div>
                <div className="col-span-1 space-y-4">
                    <MetricCard
                        icon="clock"
                        title="Fulfillment Time"
                        value="0h"
                        change={{ value: "0.0%", direction: "up" }}
                        description="0% faster than last month"
                    />
                    <MetricCard
                        icon="users"
                        title="Staff Consistency"
                        value="0%"
                        change={{ value: "0.0%", direction: "up" }}
                        description="1 regular staff members"
                    />
                    <MetricCard
                        icon="alert-triangle"
                        title="Cancellation Risk"
                        value="Low"
                        description="0 shifts need attention"
                    />
                </div>
            </div>

            {/* Bottom Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    icon="dollar-sign"
                    title="Cost Efficiency"
                    value="10/10"
                    change={{ value: "0.0%", direction: "up" }}
                    description="+100% vs benchmark"
                />
                <MetricCard
                    icon="star"
                    title="Care Quality Index"
                    value="0/100"
                    change={{ value: "0.0%", direction: "up" }}
                    description="Based on ratings, continuity & expertise"
                />
                <MetricCard
                    icon="check-square"
                    title="Pattern Efficiency"
                    value="72%"
                    change={{ value: "0.0%", direction: "up" }}
                    description="0 optimization opportunities"
                />
            </div>

            {/* Additional Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <div className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Agency Dependency</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <div className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">Advance Planning</h3>
                            <p className="text-lg font-bold">0 days</p>
                        </div>
                    </div>
                </Card>
            </div>

            {children}
        </div>
    );
};

export default DashboardLayout;