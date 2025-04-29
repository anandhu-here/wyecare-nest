import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    Calendar,
    Building,
    Printer,
    Download,
    PoundSterling,
    TrendingUp,
    TrendingDown,
    BarChart,
    User,
    AlarmClock,
    Coffee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReactToPrint } from 'react-to-print';

// Updated type definition with billable hours
interface TimesheetSummary {
    totalHours: number;
    totalBillableHours: number;
    totalBreakHours: number;
    totalPay: number;
    totalShifts: number;
    regularHours: number;
    weekendHours: number;
    holidayHours: number;
    emergencyHours: number;
    avgHoursPerShift: number;
    avgPayPerShift: number;
    avgHourlyRate: number;
    organizations: {
        [key: string]: {
            name: string;
            totalHours: number;
            totalBillableHours: number;
            totalBreakHours: number;
            totalPay: number;
            shifts: number;
        }
    };
    staffMembers?: {
        [key: string]: {
            id: string;
            name: string;
            role: string;
            totalHours: number;
            totalBillableHours: number;
            totalBreakHours: number;
            totalPay: number;
            shifts: number;
        }
    };
    topOrganization?: {
        name: string;
        hours: number;
        percentage: number;
    };
    leastOrganization?: {
        name: string;
        hours: number;
        percentage: number;
    };
    topStaff?: {
        name: string;
        role: string;
        hours: number;
        percentage: number;
    };
    leastStaff?: {
        name: string;
        role: string;
        hours: number;
        percentage: number;
    };
    dateRange: {
        from: Date;
        to: Date;
    };
}

interface SummaryModalProps {
    open: boolean;
    onClose: () => void;
    summary: TimesheetSummary | null;
    loading: boolean;
}

const SummaryModal: React.FC<SummaryModalProps> = ({
    open,
    onClose,
    summary,
    loading
}) => {
    const printRef = useRef(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onBeforeGetContent: () => {
            setIsPrinting(true);
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 300);
            });
        },
        onAfterPrint: () => setIsPrinting(false),
        documentTitle: 'Timesheet_Summary_Report',
        pageStyle: `
      @page {
          size: A4;
          margin-block: 20mm;
      }
      @media print {
          body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
          }
          
          .no-print {
              display: none !important;
          }

          .print-content {
              padding: 0 !important;
          }

          table {
              break-inside: avoid;
          }

          tr {
              break-inside: avoid;
          }

          .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
          }

          /* Force page break for detailed section */
          .page-break {
              break-before: page !important;
              page-break-before: always !important;
              padding-top: 1rem !important;
          }

          /* Ensure header stays at top of new page */
          .page-break h4 {
              margin-top: 0 !important;
          }
      }
    `,
    });

    if (!summary && !loading) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] md:w-[700px] max-w-full rounded-md max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Timesheet Summary
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-muted-foreground">Calculating your timesheet data...</p>
                    </div>
                ) : (
                    <div ref={printRef} className={`${isPrinting ? 'print-container' : ''}`}>
                        {/* Print Header - Only visible when printing */}
                        <div className="hidden print:block mb-6">
                            <h1 className="text-2xl font-bold text-center">Timesheet Summary Report</h1>
                            <p className="text-center text-gray-500 mt-1">
                                {summary?.dateRange?.from && summary?.dateRange?.to ? (
                                    `${format(summary.dateRange.from, "MMM dd, yyyy")} - ${format(summary.dateRange.to, "MMM dd, yyyy")}`
                                ) : "All time"}
                            </p>
                            <Separator className="my-4" />
                        </div>

                        {/* Main Content */}
                        <div className="space-y-6">
                            {/* Date Range Info */}
                            <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">Showing data for:</span>
                                <span className="font-medium">
                                    {summary?.dateRange?.from && summary?.dateRange?.to ? (
                                        `${format(summary.dateRange.from, "MMM dd, yyyy")} - ${format(summary.dateRange.to, "MMM dd, yyyy")}`
                                    ) : "All time"}
                                </span>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                            <Clock className="mr-2 h-4 w-4 text-primary" />
                                            Billable Hours
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary?.totalBillableHours?.toFixed(1)}h</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Across {summary?.totalShifts} shifts (avg. {summary?.avgHoursPerShift?.toFixed(1)}h per shift)
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                            <PoundSterling className="mr-2 h-4 w-4 text-primary" />
                                            Total Pay
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">£{summary?.totalPay?.toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Avg. £{summary?.avgHourlyRate?.toFixed(2)}/hr (£{summary?.avgPayPerShift?.toFixed(2)} per shift)
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                            <Building className="mr-2 h-4 w-4 text-primary" />
                                            Organizations
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{Object.keys(summary?.organizations || {}).length}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Different organizations worked with
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Hours Breakdown */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center">
                                        <AlarmClock className="mr-2 h-4 w-4 text-primary" />
                                        Hours Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
                                            <div className="text-sm font-medium">Regular</div>
                                            <div className="text-lg font-bold">{summary?.regularHours?.toFixed(1)}h</div>
                                        </div>
                                        <div className="p-3 bg-purple-50 text-purple-700 rounded-md">
                                            <div className="text-sm font-medium">Weekend</div>
                                            <div className="text-lg font-bold">{summary?.weekendHours?.toFixed(1)}h</div>
                                        </div>
                                        <div className="p-3 bg-green-50 text-green-700 rounded-md">
                                            <div className="text-sm font-medium">Holiday</div>
                                            <div className="text-lg font-bold">{summary?.holidayHours?.toFixed(1)}h</div>
                                        </div>
                                        <div className="p-3 bg-red-50 text-red-700 rounded-md">
                                            <div className="text-sm font-medium">Emergency</div>
                                            <div className="text-lg font-bold">{summary?.emergencyHours?.toFixed(1)}h</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between text-sm">
                                        <div className="flex items-center">
                                            <Coffee className="mr-1 h-4 w-4 text-orange-500" />
                                            <span>Break Hours: {summary?.totalBreakHours?.toFixed(1)}h</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Total Hours: {summary?.totalHours?.toFixed(1)}h</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Staff Breakdown (if available) */}
                            {summary?.topStaff && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg">Staff Breakdown</h3>

                                    {/* Top and Least Staff */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {summary.topStaff && (
                                            <Card className="border-l-4 border-l-purple-500">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-purple-500" />
                                                        Top Staff
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="font-bold">{summary.topStaff.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        <Badge variant="outline" className="capitalize mt-1">
                                                            {summary.topStaff.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm">{summary.topStaff.hours?.toFixed(1)}h</span>
                                                        <span className="text-sm font-medium text-purple-600">
                                                            {summary.topStaff.percentage?.toFixed(0)}% of total
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {summary.leastStaff && (
                                            <Card className="border-l-4 border-l-teal-500">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-teal-500" />
                                                        Least Active Staff
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="font-bold">{summary.leastStaff.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        <Badge variant="outline" className="capitalize mt-1">
                                                            {summary.leastStaff.role}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm">{summary.leastStaff.hours?.toFixed(1)}h</span>
                                                        <span className="text-sm font-medium text-teal-600">
                                                            {summary.leastStaff.percentage?.toFixed(0)}% of total
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Organization Breakdown */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Organization Breakdown</h3>

                                {/* Top and Least */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {summary?.topOrganization && (
                                        <Card className="border-l-4 border-l-green-500">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                                                    Most Hours
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="font-bold">{summary.topOrganization.name}</div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm">{summary.topOrganization.hours?.toFixed(1)}h</span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        {summary.topOrganization.percentage?.toFixed(0)}% of total
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {summary?.leastOrganization && (
                                        <Card className="border-l-4 border-l-blue-500">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                                                    <TrendingDown className="mr-2 h-4 w-4 text-blue-500" />
                                                    Least Hours
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="font-bold">{summary.leastOrganization.name}</div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm">{summary.leastOrganization.hours?.toFixed(1)}h</span>
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {summary.leastOrganization.percentage?.toFixed(0)}% of total
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Detailed Breakdown */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Detailed Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {summary?.organizations && Object.entries(summary.organizations)
                                                .sort(([, a], [, b]) => b.totalBillableHours - a.totalBillableHours)
                                                .map(([id, org]) => (
                                                    <div key={id}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div className="font-medium">{org.name}</div>
                                                            <div className="text-sm text-muted-foreground">{org.shifts} shifts</div>
                                                        </div>

                                                        <div className="flex justify-between text-sm">
                                                            <div>{org.totalBillableHours?.toFixed(1)} billable hours</div>
                                                            <div>£{org.totalPay?.toFixed(2)}</div>
                                                        </div>

                                                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{
                                                                    width: `${(org.totalBillableHours / summary.totalBillableHours) * 100}%`
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <Separator className="my-3" />
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Print Footer */}
                        <div className="hidden print:block mt-8">
                            <Separator className="my-4" />
                            <div className="text-center text-sm text-gray-500">
                                <p>Generated on {format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Close
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="w-full sm:w-auto"
                        disabled={loading || isPrinting}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SummaryModal;