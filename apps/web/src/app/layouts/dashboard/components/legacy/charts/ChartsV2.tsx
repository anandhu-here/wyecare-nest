import React, { useMemo } from 'react';
import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import useChartTheme from './chartsTheme';

function format(date: Date, pattern: string): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');

    switch (pattern) {
        case 'MMM dd':
            return `${month} ${day}`;
        default:
            return date.toLocaleDateString();
    }
}

interface ShiftDistributionProps {
    data: any;
    type?: 'agency' | 'home' | 'staff';
    isDarkMode?: boolean;
}
export const ShiftDistributionChart = ({
    data,
    type = 'agency',
    isDarkMode = false
}) => {
    const chartTheme = useChartTheme(isDarkMode);

    let series = [];
    let categories = [];

    if (type === 'agency') {
        const dates = Object.keys(data.shifts.received.distribution?.byDate).sort();
        categories = dates;
        series = [
            {
                name: 'Received',
                data: dates.map(date => data.shifts.received.distribution?.byDate[date] || 0)
            },
            {
                name: 'Assigned',
                data: dates.map(date => data.shifts.assigned.distribution?.byDate[date] || 0)
            },
            {
                name: 'Completed',
                data: dates.map(date => data.shifts.completed.distribution?.byDate[date] || 0)
            }
        ];
    } else if (type === 'staff') {
        const dates = Object.keys(data.shifts.distribution?.byDate || {}).sort();
        categories = dates || [];
        series = [
            {
                name: 'Shifts',
                data: dates.map(date => data.shifts.distribution?.byDate[date] || 0)
            }
        ];
    } else {
        const dates = Object.keys(data.shifts.published.distribution?.byDate).sort();
        categories = dates;
        series = [
            {
                name: 'Published',
                data: dates.map(date => data.shifts.published.distribution?.byDate[date] || 0)
            },
            {
                name: 'Direct',
                data: dates.map(date => data.shifts.direct.distribution?.byDate[date] || 0)
            },
            {
                name: 'Agency',
                data: dates.map(date => data.shifts.agency.distribution?.byDate[date] || 0)
            }
        ];
    }

    const options = useMemo(() => ({
        chart: {
            type: 'area',
            toolbar: {
                show: false,
                tools: {
                    download: false,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                },
                autoSelected: 'zoom'
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            dropShadow: {
                enabled: true,
                top: 3,
                left: 0,
                blur: 4,
                opacity: 0.1
            },
            ...chartTheme
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.15,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        dataLabels: {
            enabled: false
        },
        colors: [
            '#3b82f6', // blue
            '#8b5cf6', // purple
            '#10b981', // green
        ],
        xaxis: {
            categories: categories,
            labels: {
                formatter: (val) => format(new Date(val), 'MMM dd'),
                style: {
                    colors: isDarkMode ? '#94a3b8' : '#64748b',
                    fontSize: '11px'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            },
            ...chartTheme.xaxis
        },
        yaxis: {
            labels: {
                formatter: (val) => Math.round(val).toString(),
                style: {
                    colors: isDarkMode ? '#94a3b8' : '#64748b',
                    fontSize: '11px'
                }
            }
        },
        tooltip: {
            theme: isDarkMode ? 'dark' : 'light',
            shared: true,
            intersect: false,
            style: {
                fontSize: '12px',
                fontFamily: 'inherit'
            },
            y: {
                formatter: (val) => Math.round(val).toString()
            },
            marker: {
                show: true
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            offsetY: -8,
            itemMargin: {
                horizontal: 12
            },
            ...chartTheme.legend
        },
        grid: {
            ...chartTheme.grid
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    legend: {
                        position: 'bottom',
                        horizontalAlign: 'center',
                        offsetY: 0
                    }
                }
            }
        ]
    }), [isDarkMode, categories, chartTheme]);

    return (
        <ReactApexChart
            options={options}
            series={series}
            type="area"
            height="100%"
            width="100%"
        />
    );
};


export const FinancialChart: React.FC<{
    data: any;
    isDarkMode?: boolean;
}> = ({
    data,
    isDarkMode = false
}) => {
        const theme = useTheme();
        const chartTheme = useChartTheme(isDarkMode);

        const options: ApexOptions = useMemo(() => ({
            chart: {
                type: 'bar',
                stacked: false,
                ...chartTheme
            },
            stroke: { width: [0, 2] },
            plotOptions: {
                bar: {
                    columnWidth: '50%'
                }
            },
            colors: [
                '#3b82f6',
                '#10b981'
            ],
            xaxis: {
                categories: Object.keys(data.periodEarnings.daily).sort(),
                labels: {
                    formatter: (val) => format(new Date(val), 'MMM dd'),
                    style: {
                        colors: isDarkMode ? '#9ca3af' : '#4b5563'
                    }
                },
                ...chartTheme.xaxis
            },
            yaxis: [
                {
                    title: {
                        text: 'Earnings',
                        style: {
                            color: isDarkMode ? '#9ca3af' : '#4b5563'
                        }
                    },
                    labels: {
                        formatter: (val) => `£${val.toFixed(0)}`,
                        style: {
                            colors: isDarkMode ? '#9ca3af' : '#4b5563'
                        }
                    }
                }
            ],
            tooltip: {
                theme: isDarkMode ? 'dark' : 'light',
                shared: true,
                intersect: false
            },
            grid: {
                ...chartTheme.grid
            }
        }), [isDarkMode, data, chartTheme]);

        const series = [
            {
                name: 'Earnings',
                type: 'column',
                data: Object.values(data.periodEarnings.daily)
            }
        ];

        return (
            <ReactApexChart
                options={options}
                series={series}
                type="line"
                height="100%"
            />
        );
    };

export const PerformanceRadar: React.FC<{
    data: any;
    isDarkMode?: boolean;
}> = ({
    data,
    isDarkMode = false
}) => {
        const theme = useTheme();
        const chartTheme = useChartTheme(isDarkMode);

        const options: ApexOptions = useMemo(() => ({
            chart: {
                type: 'radar',
                ...chartTheme
            },
            colors: ['#3b82f6'],
            fill: {
                opacity: 0.5
            },
            xaxis: {
                categories: ['Completion Rate', 'On-Time', 'Rating', 'Response Rate', 'Utilization'],
                labels: {
                    style: {
                        colors: Array(5).fill(isDarkMode ? '#9ca3af' : '#4b5563')
                    }
                }
            },
            yaxis: {
                show: true,
                labels: {
                    style: {
                        colors: isDarkMode ? '#9ca3af' : '#4b5563'
                    }
                }
            },
            grid: {
                ...chartTheme.grid
            }
        }), [isDarkMode, chartTheme]);

        const series = [
            {
                name: 'Performance',
                data: [85, 90, 75, 95, 80]
            }
        ];

        return (
            <ReactApexChart
                options={options}
                series={series}
                type="radar"
                height="100%"
            />
        );
    };

export const CostAnalysisChart: React.FC<{
    data: any;
    isDarkMode?: boolean;
}> = ({
    data,
    isDarkMode = false
}) => {
        const theme = useTheme();
        const chartTheme = useChartTheme(isDarkMode);

        const options: ApexOptions = useMemo(() => ({
            chart: {
                type: 'donut',
                ...chartTheme
            },
            colors: [
                '#10b981',
                '#f59e0b',
                '#ef4444'
            ],
            labels: ['Paid', 'Pending', 'Overdue'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                labels: {
                    colors: isDarkMode ? '#f3f4f6' : '#1f2937'
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                formatter: function (w) {
                                    return `£${data.total.toLocaleString()}`;
                                }
                            },
                            value: {
                                color: isDarkMode ? '#f3f4f6' : '#1f2937',
                                formatter: function (value) {
                                    return `£${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            },
            tooltip: {
                theme: isDarkMode ? 'dark' : 'light',
                y: {
                    formatter: function (value) {
                        return `£${value.toLocaleString()}`;
                    }
                }
            },
            stroke: {
                width: 2
            },
            dataLabels: {
                enabled: true,
                style: {
                    colors: [isDarkMode ? '#f3f4f6' : '#1f2937']
                },
                formatter: function (val, opts) {
                    return `${Math.round(Number(val))}%`;
                }
            }
        }), [isDarkMode, data, chartTheme]);

        const series = [
            data.paid || 0,
            data.pending || 0,
            0
        ];

        return (
            <></>
        );
    };