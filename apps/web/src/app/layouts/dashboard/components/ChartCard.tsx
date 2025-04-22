import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
    title: string;
    subtitle?: string;
}

const ChartCard = ({ title, subtitle }: ChartCardProps) => {
    // Mock data for chart visualization
    const mockChartLines = Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center h-8">
            <span className="text-xs text-gray-500 w-6 text-right mr-2">{5 - i}</span>
            <div className="flex-1 border-b border-dashed border-gray-300 dark:border-gray-700"></div>
        </div>
    ));

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
                {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full flex flex-col justify-between">
                    {mockChartLines}
                </div>
            </CardContent>
        </Card>
    );
};

export default ChartCard;