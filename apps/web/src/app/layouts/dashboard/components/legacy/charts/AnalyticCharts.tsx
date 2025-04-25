import { Box, Typography } from "@mui/material";
import { Theme } from "@mui/material/styles";
import { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336'];


interface ChartData {
    date: string;
    completed: number;
    assigned: number;
    received: number;
    shifts?: number;
}

// Line Chart Component
interface ShiftDistributionChartProps {
    data: any;  // Your RTK response data
    theme: Theme;
}

export const ShiftDistributionChart: React.FC<ShiftDistributionChartProps> = ({ data, theme }) => {
    // Extract and transform data for the chart
    const series = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];

        return [
            {
                name: 'Completed',
                data: data.map(item => item.completed)
            },
            {
                name: 'Assigned',
                data: data.map(item => item.assigned)
            },
            {
                name: 'Received',
                data: data.map(item => item.received)
            }
        ];
    }, [data]);

    const options: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                }
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        colors: [
            theme?.palette?.success?.main,
            theme.palette.warning.main,
            theme.palette.primary.main
        ],
        xaxis: {
            categories: data?.map(item => item.date) || [],
            labels: {
                rotate: -45,
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                formatter: (value: number) => Math.round(value).toString()
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (value: number) => Math.round(value).toString()
            }
        },
        legend: {
            position: 'top'
        }
    };

    if (!data || data.length === 0) {
        return <Box height="100%" display="flex" alignItems="center" justifyContent="center">
            <Typography color="textSecondary">No data available</Typography>
        </Box>;
    }

    return (
        <ReactApexChart
            options={options}
            series={series}
            type="line"
            height="100%"
        />
    );
};

interface ShiftBarChartProps {
    data: any[];
    theme: Theme;
}

export const ShiftBarChart: React.FC<ShiftBarChartProps> = ({ data, theme }) => {
    const series = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];

        return [
            {
                name: 'Shifts',
                data: data.map(item => item.shifts || 0)
            },
            {
                name: 'Completed',
                data: data.map(item => item.completed || 0)
            }
        ];
    }, [data]);

    const options: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: {
                show: true
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                borderRadius: 4,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: [theme.palette.primary.main, theme?.palette?.success?.main],
        xaxis: {
            categories: data?.map(item => item.date) || [],
            labels: {
                rotate: -45,
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                formatter: (value: number) => Math.round(value).toString()
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: (value: number) => Math.round(value).toString()
            }
        },
        legend: {
            position: 'top'
        }
    };

    if (!data || data.length === 0) {
        return <Box height="100%" display="flex" alignItems="center" justifyContent="center">
            <Typography color="textSecondary">No data available</Typography>
        </Box>;
    }

    return (
        <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height="100%"
        />
    );
};

interface PerformanceData {
    name: string;
    value: number;
}

interface PerformanceDonutChartProps {
    data: PerformanceData[];
}

export const PerformanceDonutChart: React.FC<PerformanceDonutChartProps> = ({ data }) => {
    const options: ApexOptions = {
        chart: {
            type: 'donut' as const
        },
        colors: COLORS,
        labels: data.map(item => item.name),
        legend: {
            position: 'bottom'
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true
                        },
                        value: {
                            show: true,
                            formatter: function (val: string) {
                                return parseFloat(val).toFixed(0);
                            }
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: function (w) {
                                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                                return total.toString();
                            }
                        }
                    }
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }],
        tooltip: {
            y: {
                formatter: function (val: number) {
                    return val.toString();
                }
            }
        }
    };

    return (
        <ReactApexChart
            options={options}
            series={data.map(item => item.value)}
            type="donut"
            height="100%"
        />
    );
};