import {
    Clock, ClipboardList, Building2, DollarSign, Users, Star,
    AlertTriangle, Calendar, TrendingUp, TrendingDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartCard, MetricCard, RelationCard } from "../DashboardV2";
import { CostAnalysisChart, FinancialChart, PerformanceRadar, ShiftDistributionChart } from "../charts/ChartsV2";
import ReactApexChart from "react-apexcharts";
import { formatNumberValue } from "@/lib/util";

export const renderHomeAnalytics = (data: any, isDarkMode?: boolean) => {
    // Check if innovative metrics are available
    const hasInnovativeMetrics = data.innovativeMetrics !== undefined;

    // Create metrics array based on available data
    const metrics = hasInnovativeMetrics ? [
        {
            title: 'Fulfillment Time',
            value: `${formatNumberValue(data.innovativeMetrics.fulfillment.averageHours)}h`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.fulfillment.improvementRate)}% faster than last month`,
            icon: Clock,
            trend: data.innovativeMetrics.fulfillment.trend,
            color: 'indigo',
            tooltip: "How quickly you fill open shifts. Lower hours mean you're finding staff faster, which helps reduce staffing gaps and emergency situations."
        },
        {
            title: 'Staff Consistency',
            value: `${formatNumberValue(data.staffing.consistency || 0)}%`,
            subtitle: `${formatNumberValue(data.staffing.returningStaff || 0)} regular staff members`,
            icon: Users,
            trend: data.staffing.consistencyTrend || 0,
            color: 'teal',
            tooltip: "How often the same staff return to work at your home. Higher percentages mean residents see familiar faces more often, leading to better continuity of care."
        },
        {
            title: 'Cancellation Risk',
            value: data.innovativeMetrics.cancellationRisk.score > 50 ? "High" :
                data.innovativeMetrics.cancellationRisk.score > 30 ? "Medium" : "Low",
            subtitle: `${formatNumberValue(data.innovativeMetrics.cancellationRisk.atRiskShifts)} shifts need attention`,
            icon: AlertTriangle,
            color: data.innovativeMetrics.cancellationRisk.score > 50 ? "error" :
                data.innovativeMetrics.cancellationRisk.score > 30 ? "warning" : "success",
            tooltip: "Alerts you to shifts that might go unfilled. Takes into account emergency shifts, last-minute postings, and shifts with no assigned staff. Address high-risk shifts first to ensure coverage."
        },
        {
            title: 'Cost Efficiency',
            value: `${formatNumberValue(data.innovativeMetrics.costEfficiency.rating)}/10`,
            subtitle: `${data.innovativeMetrics.costEfficiency.savings > 0 ? '+' : ''}${formatNumberValue(data.innovativeMetrics.costEfficiency.savings)}% vs benchmark`,
            icon: DollarSign,
            trend: data.innovativeMetrics.costEfficiency.trend,
            color: 'violet',
            tooltip: "How your staffing costs compare to similar homes. Higher scores mean you're spending less per shift than average, while lower scores indicate higher-than-average costs."
        },
        {
            title: 'Care Quality Index',
            value: `${formatNumberValue(data.innovativeMetrics.qualityIndex.score)}/100`,
            subtitle: `Based on ratings, continuity & expertise`,
            icon: Star,
            trend: data.innovativeMetrics.qualityIndex.trend,
            color: 'primary',
            tooltip: "An overall score of your care quality from a staffing perspective. Considers staff ratings, consistency of familiar faces, and successful shift coverage. Higher scores indicate better resident care."
        },
        {
            title: 'Pattern Efficiency',
            value: `${formatNumberValue(data.innovativeMetrics.patternEfficiency.efficiency)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.patternEfficiency.optimizationTips)} optimization opportunities`,
            icon: ClipboardList,
            trend: data.innovativeMetrics.patternEfficiency.trend,
            color: 'info',
            tooltip: "Shows if your shifts match your actual staffing needs. Higher percentages mean you're publishing the right types of shifts at the right times. The optimization opportunities suggest shifts to add or reduce."
        },
        {
            title: 'Agency Dependency',
            value: `${formatNumberValue(data.innovativeMetrics.agencyDependency.dependencyRatio)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.agencyDependency.reduction)}% reduction from last month`,
            icon: Building2,
            trend: -data.innovativeMetrics.agencyDependency.trend,
            color: 'secondary',
            tooltip: "What percentage of your shifts rely on agency staff. Lower percentages typically mean better cost control and care continuity. The reduction shows your progress in building direct staffing capacity."
        },
        {
            title: 'Advance Planning',
            value: `${formatNumberValue(data.innovativeMetrics.advancePlanning.averageDays)} days`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.advancePlanning.improvement)}% improvement`,
            icon: Calendar,
            trend: data.innovativeMetrics.advancePlanning.trend,
            color: 'success',
            tooltip: "How far ahead you plan your shifts. More days means better planning. Shifts published further in advance are more likely to be filled and lead to better staff satisfaction."
        }
    ] : [
        // Original metrics
        {
            title: 'Published Shifts',
            value: formatNumberValue(data.shifts.published.total),
            subtitle: `${formatNumberValue((data.shifts.published.completed / data.shifts.published.total) * 100)}% filled`,
            icon: ClipboardList,
            color: 'primary',
            tooltip: "The total number of shifts you've created in this period and what percentage have been successfully filled with staff."
        },
        {
            title: 'Agency Usage',
            value: formatNumberValue(data.shifts.agency.total),
            subtitle: `${formatNumberValue((data.shifts.agency.completed / data.shifts.agency.total) * 100)}% completed`,
            icon: Building2,
            color: 'warning',
            tooltip: "How many shifts were assigned to agency staff and what percentage were successfully completed. Helps track external staffing reliability."
        },
        {
            title: 'Direct Staff',
            value: formatNumberValue(data.staffing.total),
            subtitle: `${formatNumberValue(Object.keys(data.staffing.byType).length)} staff types`,
            icon: Users,
            color: 'success',
            tooltip: "The number of direct staff on your team and how many different types of roles they fill (e.g., nurses, carers, seniors)."
        },
        {
            title: 'Total Cost',
            value: `£${formatNumberValue(data.costs.total.toLocaleString())}`,
            subtitle: `£${formatNumberValue(data.costs.metrics.averagePerShift)} per shift`,
            icon: DollarSign,
            color: 'info',
            tooltip: "Your total staffing costs for this period and how much you're spending on average for each shift."
        }
    ];

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}

            {/* Main Charts Section */}
            <div className="grid gap-6">
                {/* Shift Distribution Chart */}
                <ChartCard title="Shift Distribution">
                    <ShiftDistributionChart
                        data={data}
                        type="home"
                        isDarkMode={isDarkMode}
                    />
                </ChartCard>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {metrics.map((metric, index) => (
                        <MetricCard key={index} {...metric} />
                    ))}
                </div>


                {/* Staff Distribution */}
                <ChartCard title="Staff Distribution">
                    <StaffDistributionSection data={data.staffing} isDarkMode={isDarkMode} />
                </ChartCard>
            </div>
            {/* Advanced Metrics Section - Only show if innovative metrics are available */}
            {/* {hasInnovativeMetrics && (
                <ChartCard title="Care Quality Factors">
                    <QualityFactorsChart
                        data={data.innovativeMetrics.qualityIndex.components}
                        isDarkMode={isDarkMode}
                    />
                </ChartCard>
            )} */}



            {/* Agency Relations & Cost Analysis */}
            <div className="grid gap-6">
                {/* Agency Relations */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Agency Relations
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {data.agencyRelations.map((agency, index) => (
                            <AgencyCard key={index} agency={agency} />
                        ))}
                    </div>
                </div>

                {/* Cost Analysis */}
                <ChartCard title="Cost Analysis">
                    <CostAnalysisSection data={data.costs} isDarkMode={isDarkMode} />
                </ChartCard>
            </div>
        </div>
    );
};


const StaffDistributionSection = ({ data, isDarkMode }) => (
    <div className="space-y-6 p-4">
        {/* Staff Type Distribution */}
        <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Staff Type Distribution
            </h3>
            <div className="space-y-4">
                {Object.entries(data.byType).map(([role, count], index) => (
                    <div key={index}>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {role}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {count}/{data.total}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(Number(count) / data.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Add a new component for Quality Factors radar chart
const QualityFactorsChart = ({ data, isDarkMode }) => {
    const options = {
        chart: {
            type: 'radar',
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        colors: ['#8B5CF6'],
        labels: ['Rating', 'Staff Consistency', 'Shift Fulfillment'],
        markers: {
            size: 5,
            hover: {
                size: 7
            }
        },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: isDarkMode ? '#374151' : '#E5E7EB',
                    fill: {
                        colors: [
                            isDarkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(249, 250, 251, 1)',
                            isDarkMode ? 'rgba(55, 65, 81, 0.1)' : 'rgba(243, 244, 246, 1)'
                        ]
                    }
                }
            }
        },
        yaxis: {
            tickAmount: 5,
            labels: {
                formatter: function (val) {
                    return val.toFixed(0);
                },
                style: {
                    colors: isDarkMode ? '#9CA3AF' : '#4B5563'
                }
            },
            max: 100
        },
        xaxis: {
            labels: {
                style: {
                    colors: isDarkMode ? '#9CA3AF' : '#4B5563',
                    fontSize: '12px'
                }
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            y: {
                formatter: (val) => `${val.toFixed(1)}%`
            }
        }
    };

    // Convert data to percentages for radar chart
    const series = [{
        name: 'Quality Factors',
        data: [
            // Convert rating from 0-5 to 0-100
            data.avgRating ? (data.avgRating / 5) * 100 : 0,
            // Staff consistency is already 0-100
            data.consistency || 0,
            // Shift fulfillment is already 0-100
            data.fulfillment || 0
        ]
    }];

    return (
        <div className="w-full h-full">
            <ReactApexChart
                options={options}
                series={series}
                type="radar"
                height="350"
            />
        </div>
    );
};


const AgencyCard = ({ agency }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
        <div className="flex items-start justify-between mb-4">
            <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                    {agency.agencyName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {agency.shiftsPublished} shifts published
                </p>
            </div>
            <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {agency.averageRating?.toFixed(1) || 'N/A'}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fill Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {((agency.shiftsCompleted / agency.shiftsPublished) * 100).toFixed(1)}%
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {agency.responseRate?.toFixed(1)}%
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Staff</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {agency.activeStaff}
                </p>
            </div>
        </div>

        <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                        width: `${(agency.shiftsCompleted / agency.shiftsPublished) * 100}%`
                    }}
                />
            </div>
        </div>
    </div>
);

const CostAnalysisSection = ({ data, isDarkMode }) => {
    const options = {
        chart: {
            type: 'donut',
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        colors: ['#10B981', '#F59E0B', '#EF4444'],
        labels: ['Paid', 'Pending', 'Outstanding'],
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            floating: false,
            fontSize: '14px',
            offsetY: 7,
            itemMargin: {
                horizontal: 10,
                vertical: 5
            },
            labels: {
                colors: !isDarkMode ? '#F3F4F6' : '#1F2937'
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            offsetY: -10
                        },
                        value: {
                            show: true,
                            fontSize: '16px',
                            fontWeight: 600,
                            formatter: (val) => Math.round(val)
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '16px',
                            fontWeight: 600,
                            formatter: (w) => {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${Math.round(val)}%`
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            y: {
                formatter: (val) => `£${val.toLocaleString()}`
            }
        }, responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    const series = [
        data.paid || 0,
        data.pending || 0,
        data.total - (data.paid + data.pending) || 0
    ];

    return (
        <div className="w-full h-full">
            <ReactApexChart
                options={options}
                series={series}
                type="donut"
                height="100%"
                width="100%"
            />
        </div>
    );
};