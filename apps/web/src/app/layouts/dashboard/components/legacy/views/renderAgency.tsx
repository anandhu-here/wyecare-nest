import {
    Clock,
    ClipboardList,
    DollarSign,
    Users,
    Star,
    Building2,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Globe,
    Sparkles,
    BarChart2,
    Shield,
} from "lucide-react";
import { ChartCard, MetricCard, RelationCard } from "../DashboardV2";
import { FinancialChart, PerformanceRadar, ShiftDistributionChart } from "../charts/ChartsV2";
import { useDarkMode } from "usehooks-ts";
import ReactApexChart from "react-apexcharts";
import { formatNumberValue } from "@/lib/util";
export const renderAgencyAnalytics = (data: any, isDarkMode: boolean) => {
    const hasInnovativeMetrics = data.innovativeMetrics !== undefined;
    const metrics = hasInnovativeMetrics ? [
        {
            title: 'Response Time',
            value: `${formatNumberValue(data.innovativeMetrics.responseTime.averageHours)}h`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.responseTime.improvementRate)}% faster than last month`,
            icon: Clock,
            trend: data.innovativeMetrics.responseTime.trend,
            color: 'indigo',
            tooltip: "How quickly you respond to shift requests from care homes. Lower hours mean faster responses, which increases your chances of securing shifts."
        },
        {
            title: 'Staff Utilization',
            value: `${formatNumberValue(data.innovativeMetrics.staffUtilization.utilizationRate)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.staffUtilization.activeStaffCount)} active staff members`,
            icon: Users,
            trend: data.innovativeMetrics.staffUtilization.utilizationRate -
                (data.staffMetrics.active > 0 ? ((data.staffMetrics.active / data.staffMetrics.total) * 100) : 0),
            color: 'success',
            tooltip: "What percentage of your staff are actively working shifts. Higher utilization means better resource efficiency. The balance score shows how evenly work is distributed among staff."
        },
        {
            title: 'Revenue Performance',
            value: `£${formatNumberValue(data.innovativeMetrics.revenuePerformance.revenuePerShift)}`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.revenuePerformance.achievementRate)}% of potential revenue`,
            icon: DollarSign,
            trend: data.innovativeMetrics.revenuePerformance.growthRate,
            color: 'violet',
            tooltip: "Your average revenue per shift and how close you are to your revenue potential. Higher achievement rates indicate more effective pricing and shift selection."
        },
        {
            title: 'Client Retention',
            value: `${formatNumberValue(data.innovativeMetrics.clientRetention.retentionRate)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.clientRetention.returningClients)} returning clients`,
            icon: Building2,
            trend: data.innovativeMetrics.clientRetention.newClients - data.innovativeMetrics.clientRetention.lostClients,
            color: 'warning',
            tooltip: "The percentage of care homes that continue to use your agency. Higher retention rates indicate stronger client relationships and service satisfaction."
        },
        {
            title: 'Quality Score',
            value: `${formatNumberValue(data.innovativeMetrics.qualityScore.score)}/100`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.qualityScore.averageRating)} average rating`,
            icon: Star,
            color: 'primary',
            tooltip: "Overall quality of your service combining staff ratings, shift fulfillment, and staff quality. Higher scores indicate better care delivery and client satisfaction."
        },
        {
            title: 'Market Reach',
            value: formatNumberValue(data.innovativeMetrics.marketPenetration.servedHomes),
            subtitle: `${formatNumberValue(data.innovativeMetrics.marketPenetration.diversificationScore)}% diversification score`,
            icon: Globe,
            color: 'info',
            tooltip: "How many care homes you serve and how well diversified your client base is. A higher diversification score means less reliance on a few key clients, reducing business risk."
        },
        {
            title: 'Fulfillment Rate',
            value: `${formatNumberValue(data.innovativeMetrics.fulfillmentRate.overallRate)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.fulfillmentRate.efficiencyScore)}% efficiency score`,
            icon: Sparkles,
            trend: data.innovativeMetrics.fulfillmentRate.completionRate -
                ((data.shifts.completed.total / data.shifts.received.total) * 100),
            color: 'secondary',
            tooltip: "The percentage of received shifts that are successfully completed. The efficiency score shows how well you convert assigned shifts to completed ones."
        },
        {
            title: 'Staff Reliability',
            value: `${formatNumberValue(data.innovativeMetrics.staffReliability.reliabilityScore)}%`,
            subtitle: `${formatNumberValue(data.innovativeMetrics.staffReliability.onTimePercentage)}% on-time arrivals`,
            icon: Shield,
            trend: data.innovativeMetrics.staffReliability.punctualityRate -
                data.innovativeMetrics.staffReliability.cancellationRate,
            color: 'teal',
            tooltip: "How reliable your staff are in showing up for shifts. Includes punctuality rates and cancellation rates. Higher scores indicate more dependable staff and better service."
        }
    ] : [
        {
            title: 'Total Shifts',
            value: formatNumberValue(data.shifts.received.total),
            subtitle: `${formatNumberValue(data.shifts.completed.total)} completed shifts`,
            icon: ClipboardList,
            color: 'primary',
            trend: data.shifts.assigned.total > 0 ?
                formatNumberValue((data.shifts.completed.total / data.shifts.assigned.total) * 100) : 0,
            tooltip: "The total number of shifts offered to your agency and how many were successfully completed. This shows your overall volume and completion success."
        },
        {
            title: 'Staff Members',
            value: formatNumberValue(data.staffMetrics.total),
            subtitle: `${formatNumberValue(data.staffMetrics.active)} active staff`,
            icon: Users,
            color: 'success',
            trend: data.staffMetrics.active > 0 ?
                formatNumberValue((data.staffMetrics.active / data.staffMetrics.total) * 100) : 0,
            tooltip: "Your total staff roster and how many are actively working shifts. The active percentage helps you identify if you're effectively utilizing your workforce."
        },
        {
            title: 'Response Rate',
            value: `${formatNumberValue((data.shifts.assigned.total / data.shifts.received.total) * 100)}%`,
            subtitle: `${formatNumberValue(data.shifts.assigned.total)} shifts assigned`,
            icon: Clock,
            color: 'warning',
            tooltip: "The percentage of offered shifts that you've assigned staff to. A higher response rate indicates better ability to meet client demand."
        },
        {
            title: 'Total Revenue',
            value: `£${formatNumberValue(data.financials.totalEarnings.toLocaleString())}`,
            subtitle: `£${formatNumberValue(data.financials.averagePerShift)} per shift`,
            icon: DollarSign,
            color: 'info',
            tooltip: "Your total revenue for this period and average earnings per shift. This helps track financial performance and pricing efficiency."
        }
    ];
    return (
        <div className="space-y-6">
            { }
            <div className="grid gap-6">
                { }
                <ChartCard title="Shift Distribution" subtitle={`${formatNumberValue(data.shifts.received.total)} total shifts`}>
                    <ShiftDistributionChart
                        data={data}
                        type="agency"
                        isDarkMode={isDarkMode}
                    />
                </ChartCard>
            </div>
            { }
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {metrics.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>
            { }
            <ChartCard title="Shift Status Overview" subtitle="Last 30 days">
                <StatusDistributionChart
                    received={data.shifts.received.total}
                    assigned={data.shifts.assigned.total}
                    completed={data.shifts.completed.total}
                    cancelled={data.shifts.received.cancelled}
                    isDarkMode={isDarkMode}
                />
            </ChartCard>
            { }
            {/* {hasInnovativeMetrics && (
                <ChartCard title="Quality Components">
                    <QualityComponentsChart
                        data={data.innovativeMetrics.qualityScore}
                        isDarkMode={isDarkMode}
                    />
                </ChartCard>
            )} */}
            { }
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Care Home Relations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.homeRelations.map((home, index) => (
                            <HomeRelationCard key={index} home={home} />
                        ))}
                    </div>
                </div>
            </div>
            { }
            {/* {hasInnovativeMetrics && (
                <ChartCard title="Shift Fulfillment Funnel">
                    <FulfillmentFunnelChart
                        data={data.innovativeMetrics.fulfillmentRate}
                        isDarkMode={isDarkMode}
                    />
                </ChartCard>
            )} */}
        </div>
    );
};
const QualityComponentsChart = ({ data, isDarkMode }) => {
    const options = {
        chart: {
            type: 'radar',
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        colors: ['#8B5CF6'],
        labels: ['Staff Rating', 'Shift Fulfillment', 'Quality Staff %'],
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
    const series = [{
        name: 'Quality Components',
        data: [
            data.averageRating ? (data.averageRating / 5) * 100 : 0,
            data.fulfillmentRate || 0,
            data.qualityStaffPercentage || 0
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
const FulfillmentFunnelChart = ({ data, isDarkMode }) => {
    const options = {
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            toolbar: {
                show: false
            },
            stacked: false,
        },
        plotOptions: {
            bar: {
                horizontal: true,
                distributed: true,
                barHeight: '70%',
                dataLabels: {
                    position: 'bottom'
                },
            }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B'],
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                fontSize: '14px',
                colors: ['#fff']
            },
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + ": " + val + "%";
            },
            offsetX: 0,
            dropShadow: {
                enabled: true
            }
        },
        stroke: {
            width: 1,
            colors: ['#fff']
        },
        xaxis: {
            categories: ['Received → Assigned', 'Assigned → Completed', 'Overall Completion'],
            labels: {
                style: {
                    colors: isDarkMode ? '#9CA3AF' : '#4B5563',
                }
            }
        },
        yaxis: {
            labels: {
                show: false
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            x: {
                show: false
            },
            y: {
                title: {
                    formatter: function () {
                        return '';
                    }
                }
            }
        },
        legend: {
            show: false
        }
    };
    const series = [
        {
            name: 'Fulfillment Rates',
            data: [
                data.assignmentRate || 0,
                data.completionRate || 0,
                data.overallRate || 0
            ]
        }
    ];
    return (
        <div className="w-full h-full">
            <ReactApexChart
                options={options}
                series={series}
                type="bar"
                height="350"
            />
        </div>
    );
};
const HomeRelationCard = ({ home }) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                    {home.homeName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {home.shiftsReceived} shifts received
                </p>
            </div>
            <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {home.averageRating?.toFixed(1) || 'N/A'}
                </span>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fill Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {((home.shiftsCompleted / home.shiftsReceived) * 100).toFixed(1)}%
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Staff</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {home.staffAssigned}
                </p>
            </div>
        </div>
        <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                        width: `${(home.shiftsCompleted / home.shiftsReceived) * 100}%`
                    }}
                />
            </div>
        </div>
    </div>
);
const StatusDistributionChart = ({
    received,
    assigned,
    completed,
    cancelled,
    isDarkMode
}) => {
    const options = {
        chart: {
            type: 'bar',
            background: 'transparent',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                speed: 800,
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        plotOptions: {
            bar: {
                distributed: true,
                borderRadius: 8,
                columnWidth: '60%',
                dataLabels: {
                    position: 'top'
                }
            }
        },
        dataLabels: {
            enabled: true,
            offsetY: -20,
            style: {
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: 600,
                colors: [isDarkMode ? '#F3F4F6' : '#1F2937']
            }
        },
        grid: {
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            strokeDashArray: 4,
            yaxis: {
                lines: {
                    show: true
                }
            },
            xaxis: {
                lines: {
                    show: false
                }
            }
        },
        xaxis: {
            categories: ['Received', 'Assigned', 'Completed', 'Cancelled'],
            labels: {
                style: {
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    colors: isDarkMode ? '#9CA3AF' : '#4B5563'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                formatter: (val) => Math.round(val),
                style: {
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    colors: isDarkMode ? '#9CA3AF' : '#4B5563'
                }
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            y: {
                formatter: (val) => Math.round(val)
            },
            style: {
                fontSize: '14px'
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'darken',
                    value: 0.1
                }
            },
            active: {
                filter: {
                    type: 'darken',
                    value: 0.2
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.2,
                gradientToColors: undefined,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.85,
                stops: [0, 90, 100]
            }
        },
        legend: {
            show: false
        },
        responsive: [{
            breakpoint: 480,
            options: {
                plotOptions: {
                    bar: {
                        borderRadius: 6,
                        columnWidth: '80%'
                    }
                },
                dataLabels: {
                    offsetY: -16,
                    style: {
                        fontSize: '12px'
                    }
                },
                xaxis: {
                    labels: {
                        style: {
                            fontSize: '12px'
                        }
                    }
                }
            }
        }]
    };
    const series = [{
        name: 'Shifts',
        data: [received, assigned, completed, cancelled]
    }];
    return (
        <div className="w-full h-full">
            <ReactApexChart
                options={options}
                series={series}
                type="bar"
                height="100%"
                width="100%"
            />
        </div>
    );
};
