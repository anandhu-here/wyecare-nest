import { ClipboardList, DollarSign, Building2, Users, Star, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard, MetricCard, RelationCard } from "../DashboardV2";
import { FinancialChart, PerformanceRadar, ShiftDistributionChart } from "../charts/ChartsV2";

export const renderStaffAnalytics = (data: any) => {
    const metrics = [
        {
            title: 'Total Shifts',
            value: data.shifts.total,
            subtitle: `${((data.shifts.completed / data.shifts.total) * 100).toFixed(1)}% completed`,
            icon: ClipboardList,
            color: 'primary'
        },
        {
            title: 'Earnings',
            value: `£${data.financials.totalEarnings.toLocaleString()}`,
            subtitle: `£${data.financials.averagePerShift} per shift`,
            icon: DollarSign,
            color: 'success'
        },
        {
            title: 'Completion Rate',
            value: `${((data.shifts.completed / data.shifts.total) * 100).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'info'
        },
        {
            title: 'Care Homes',
            value: data.homeRelations.length,
            subtitle: `Active relationships`,
            icon: Building2,
            color: 'warning'
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Metrics Cards */}
            {/* {metrics.map((metric: any, index) => (
                <div key={index}>
                    <MetricCard {...metric} />
                </div>
            ))} */}

            {/* Shift History Chart */}
            <div className="col-span-full">
                <ChartCard title="Shift History">
                    <ShiftDistributionChart data={data} type="staff" />
                </ChartCard>
            </div>

            {/* Care Home Relations */}
            <div className="col-span-full">
                <RelationCard
                    title="Care Home Relations"
                    data={data.homeRelations}
                    renderItem={(home) => (
                        <Card className="w-fit">
                            <CardContent className="p-4">
                                <div className="flex justify-between mb-4">
                                    <h3 className="text-base font-medium">{home.homeName}</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Completed Shifts
                                        </p>
                                        <p className="text-lg font-semibold mt-1">
                                            {home.completedShifts}/{home.totalShifts}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Timesheet Status
                                        </p>
                                        <div className="flex gap-4 mt-2">
                                            <span className="text-xs text-green-600">
                                                {home.timesheetStats.approved} Approved
                                            </span>
                                            <span className="text-xs text-amber-600">
                                                {home.timesheetStats.pending} Pending
                                            </span>
                                            <span className="text-xs text-red-600">
                                                {home.timesheetStats.rejected} Rejected
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                />
            </div>
        </div>
    );
};