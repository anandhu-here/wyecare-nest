import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Clock, Home, Calendar, Star, MessageSquare, DollarSign, Camera, Check, XIcon, ClockIcon, ChevronRight, ChevronLeft, Currency, PoundSterling, Settings, RotateCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { QrReader } from 'react-qr-reader';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import moment from 'moment';
// import EmployeeReviewModal from './RatingModal';
// import SummaryModal from './summary';
import { generateTimesheetSummary } from './timesheet-components/calculations';
import { selectCurrentOrganization, selectPermissions, selectUser } from '../auth/AuthSlice';
import { useApproveTimesheetMutation, useLazyGetTimesheetsQuery, useScanBarcodeMutation } from '../timesheets/timesheetApi';
import { useLazyCalculateInvoiceQuery } from '../invoice/invoiceApi';
import { useGetLinkedOrganizationsQuery } from '../organization/organizationApi';
import { useGetCareStaffsQuery } from '../staffs/staffsApi';
import { useGetShiftPatternQuery, useGetShiftPatternsQuery } from '../shift-pattern/shiftPatternsApi';
import { toast } from 'react-toastify';
import FilterModal from './timesheet-components/Filter';
import SummaryModal from './timesheet-components/summary';

interface FilterOptions {
    organizationId: string;
    careUserId: string;
    startDate: Date;
    endDate: Date;
    shiftPatternId: string;
    status: string;
    invoiceStatus: string;
    isEmergency: boolean | null;
    carerRole: string;
}

const calculatePaginationLimit = () => {
    const screenHeight = window.innerHeight;
    const availableHeight = screenHeight - 300;
    const possibleRows = Math.floor(availableHeight / 73);

    if (screenHeight < 768) return 7;
    if (screenHeight < 900) return 9;
    if (screenHeight < 1080) return 10;
    return 12;
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: 'bg-amber-100 text-amber-800',
        approved: 'bg-primary-100 text-primary-800',
        rejected: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
};

// Helper function for date comparison
const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};

const TimesheetTable = ({
    timesheets,
    onApprove,
    onReview,
    userState,
    currentOrganization,
    currentPage,
    totalItems,
    onPageChange,
    itemsPerPage
}: {
    timesheets: any[];
    onApprove: (id: string) => void;
    onReview: (timesheet: any) => void;
    userState: any;
    currentOrganization: any;
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
}) => {
    const canApproveAndReview = (timesheet) => {
        return (
            (userState?.role === 'admin' || userState?.role === 'nurse') &&
            currentOrganization?.type === 'home' &&
            timesheet?.status === 'pending' &&
            userState?._id !== timesheet?.carerDetails?._id
        );
    };

    return (
        <div className="hidden md:block">
            <Card className="hidden md:flex flex-col flex-1 bg-gray-50 border-gray-100 rounded-none shadow-lg">
                <CardContent className="p-0">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Date & Shift</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Clock In/Out</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timesheets.map((timesheet) => {
                                    const isWeekend = moment(timesheet?.shift?.date).isoWeekday() > 5;
                                    const isEmergency = timesheet?.shift?.isEmergency;
                                    let carerPay = 0;
                                    let homeRate = 0;

                                    if (userState?.role === 'admin') {
                                        const carerRole = timesheet?.carerDetails?.role?.toLowerCase();
                                        const homeId = timesheet?.shift?.homeId;

                                        const homeRateObj = timesheet?.shiftPatternData?.rates?.find(
                                            (rate) => rate.careHomeId === homeId
                                        );
                                        if (homeRateObj) {
                                            homeRate = isEmergency
                                                ? (isWeekend ? homeRateObj.emergencyWeekendRate : homeRateObj.emergencyWeekdayRate)
                                                : (isWeekend ? homeRateObj.weekendRate : homeRateObj.weekdayRate);
                                        }

                                        const userRateObj = timesheet?.shiftPatternData?.userTypeRates?.find(
                                            (rate) => rate.userType?.toLowerCase() === carerRole
                                        );
                                        if (userRateObj) {
                                            carerPay = isEmergency
                                                ? (isWeekend ? userRateObj.emergencyWeekendRate : userRateObj.emergencyWeekdayRate)
                                                : (isWeekend ? userRateObj.weekendRate : userRateObj.weekdayRate);
                                        }
                                    }

                                    return (
                                        <TableRow key={timesheet._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full overflow-hidden">
                                                        <img
                                                            src={timesheet.carerDetails?.avatarUrl || `https://ui-avatars.com/api/?name=${timesheet?.carerDetails?.firstName}+${timesheet?.carerDetails?.lastName}`}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{timesheet?.carerDetails?.firstName} {timesheet?.carerDetails?.lastName}</div>
                                                        <div className="text-sm text-gray-500">{timesheet?.carerDetails?.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {currentOrganization.type === 'home' ? timesheet?.agency?.name : timesheet?.home?.name}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    {format(new Date(timesheet?.shift?.date), 'dd MMM yyyy')}
                                                    <div className="text-sm text-gray-500">
                                                        {timesheet?.shiftPatternData?.name}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={timesheet.status} />
                                            </TableCell>
                                            <TableCell>
                                                {timesheet?.shift?.isEmergency ? (
                                                    <Badge variant='destructive' className='bg-red-400 text-white'>Emergency</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Regular</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {timesheet?.attendance?.signInTime ? (
                                                    <div>
                                                        <div>In: {format(new Date(timesheet.attendance.signInTime), 'HH:mm')}</div>
                                                        {timesheet?.attendance?.signOutTime && (
                                                            <div>Out: {format(new Date(timesheet.attendance.signOutTime), 'HH:mm')}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Not clocked in</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {timesheet.rating ? (
                                                    <div className="flex items-center">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                        <span className="ml-1">{timesheet.rating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {currentOrganization.type === 'home' ? (
                                                    <span>£{homeRate.toFixed(2)}</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div>£{carerPay?.toFixed(2)}</div>
                                                        {isEmergency && <div className="text-red-600">(Emergency)</div>}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canApproveAndReview(timesheet) && (
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onApprove(timesheet._id)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onReview(timesheet)}
                                                        >
                                                            Review
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Integrated Pagination */}
                    <div className="border-t border-gray-200 p-4 rounded-xl bg-gray-100">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                                {totalItems} results
                            </p>

                            <Pagination>
                                <PaginationContent className="ml-auto">
                                    <PaginationItem>
                                        <PaginationPrevious
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => onPageChange(currentPage - 1)}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1)
                                        .map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    className="cursor-pointer hover:bg-gray-100"
                                                    onClick={() => onPageChange(page)}
                                                    isActive={currentPage === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            className="cursor-pointer hover:bg-gray-100"
                                            onClick={() => onPageChange(currentPage + 1)}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const MobilePagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get visible pages for pagination display
    const getVisiblePages = () => {
        const pages = [];
        const maxVisiblePages = 3;
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-100 p-4 shadow-lg z-10">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {totalItems === 0 ? 'No results' :
                        `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
                </p>

                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {getVisiblePages().map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${currentPage === page
                                ? 'bg-primary text-white font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            aria-label={`Page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


const MobileHeader = ({
    onFilterClick,
    onScanClick,
    onRefresh,
    isLoading,
    filterOptions,
    hasActiveFilters,
    isSupported
}: {
    onFilterClick: () => void;
    onScanClick: () => void;
    onRefresh: () => void;
    isLoading: boolean;
    filterOptions: FilterOptions;
    hasActiveFilters: boolean;
    isSupported: boolean;
}) => {
    const userPermissions = useSelector(selectPermissions);
    return (
        <div className="bg-white sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-gray-900">Timesheets</h1>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onFilterClick}
                        className={`relative flex items-center justify-center w-10 h-10 rounded-full ${hasActiveFilters ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <Settings className="h-5 w-5" />
                        {hasActiveFilters && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-xs text-white">
                                !
                            </span>
                        )}
                    </button>

                    {isSupported && userPermissions.includes('scan_timesheets') && (
                        <button
                            onClick={onScanClick}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600"
                        >
                            <Camera className="h-5 w-5" />
                        </button>
                    )}

                    <button
                        onClick={onRefresh}
                        className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 ${isLoading ? 'animate-spin' : ''}`}
                    >
                        <RotateCw className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TimesheetCard = ({
    timesheet,
    expanded,
    onToggle,
    onApprove,
    onReview,
    userState,
    currentOrganization
}) => {
    const canApproveAndReview = (timesheet) => {
        return (
            (userState?.role === 'admin' || userState?.role === 'nurse') &&
            currentOrganization?.type === 'home' &&
            timesheet?.status === 'pending' &&
            userState?._id !== timesheet?.carerDetails?._id
        );
    };

    const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
    };

    const status = timesheet?.status || 'pending';
    const statusStyle = statusConfig[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

    // rates

    const carerRoleRaw = userState?.role;

    let carerRole = carerRoleRaw.toLowerCase();
    if (carerRole === 'senior_carer') {
        carerRole = 'senior carer';
    }
    const homeId = timesheet?.shift?.homeId;
    const isWeekend = moment(timesheet?.shift?.date).isoWeekday() > 5;
    const isEmergency = timesheet?.shift?.isEmergency;
    let carerPay = 0;



    const userRateObj = timesheet?.shiftPatternData?.userTypeRates?.find(
        (rate) => rate.userType?.toLowerCase() === carerRole
    );
    console.log('userRateObj', userRateObj);
    if (userRateObj) {
        carerPay = isEmergency
            ? (isWeekend ? userRateObj.emergencyWeekendRate : userRateObj.emergencyWeekdayRate)
            : (isWeekend ? userRateObj.weekendRate : userRateObj.weekdayRate);
    }

    const calculateHours = () => {
        if (!timesheet?.shiftPatternData?.timings || timesheet?.shiftPatternData.timings.length === 0) {
            return { total: 0, billable: 0, break: 0 };
        }

        // Find the timing for this home
        const timing = timesheet?.shiftPatternData.timings.find(
            t => t.careHomeId === timesheet?.shift?.homeId
        ) || timesheet?.shiftPatternData.timings[0]; // Fallback to first timing

        if (!timing.startTime || !timing.endTime) {
            return { total: 0, billable: 0, break: 0 };
        }

        const startTime = new Date(`2000-01-01T${timing.startTime}:00`);
        const endTime = new Date(`2000-01-01T${timing.endTime}:00`);

        // Handle cases where end time is on the next day
        let totalHours = (endTime - startTime) / (1000 * 60 * 60);
        if (totalHours < 0) totalHours += 24;

        // Use billable hours if defined
        const breakHours = timing.breakHours || 0;
        const billableHours = timing.billableHours !== undefined ?
            timing.billableHours :
            Math.max(0, totalHours - breakHours);

        return {
            total: totalHours,
            billable: billableHours,
            break: breakHours
        };
    };

    // Replace the old totalHours calculation
    const hoursInfo = calculateHours();
    const totalPay = hoursInfo?.billable * carerPay;

    return (
        <div
            className={`rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 ${isEmergency ? 'border-l-4 border-l-red-500' : ''
                }`}
        >
            <div className="p-4" onClick={onToggle}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div>
                            <h3 className="font-medium text-gray-900">{timesheet?.shiftPatternData?.name}

                                <span
                                    className='text-sm text-gray-500 ml-2'
                                >
                                    {moment(timesheet?.updatedAt || timesheet?.createdAt).isAfter(moment().subtract(24, 'hours'))
                                        ? moment(timesheet?.updatedAt || timesheet?.createdAt).fromNow()
                                        : moment(timesheet?.updatedAt || timesheet?.createdAt).format('MMM D, YYYY')}</span>
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className={`text-sm ${statusStyle.text}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="text-right">
                            <div className="text-sm font-medium">£{carerPay?.toFixed(2)}/hr</div>
                            <div className="text-sm text-gray-500">
                                {hoursInfo?.billable?.toFixed(2)}h · £{totalPay?.toFixed(2)}
                            </div>
                        </div>
                        {isEmergency && (
                            <Badge variant="outline" className="mr-2 bg-red-50 text-red-700 border-red-200">
                                Emergency
                            </Badge>
                        )}
                        {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                </div>

                {expanded && (
                    <div className="mt-4 space-y-4 overflow-hidden transition-all duration-300 ease-in-out">
                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <PoundSterling className="h-4 w-4 mr-2 text-gray-400" />
                                    Pay Information
                                </div>
                                <div className="font-medium text-gray-900">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-500">Rate:</span>
                                        <span>£{carerPay?.toFixed(2)}/hr</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-500">Billable Hours:</span>
                                        <span>{hoursInfo?.billable?.toFixed(2)}h</span>
                                    </div>
                                    <div className="flex items-center justify-between font-semibold">
                                        <span className="text-sm text-gray-500">Total:</span>
                                        <span>£{totalPay?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    Date
                                </div>
                                <div className="font-medium text-gray-900">
                                    {format(new Date(timesheet?.shift?.date), 'dd MMM yyyy')}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {timesheet?.shiftPatternData?.name}
                                </div>
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    Hours Breakdown
                                </div>
                                <div className="font-medium text-gray-900">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-500">Total Shift:</span>
                                        <span>{hoursInfo?.total.toFixed(2)}h</span>
                                    </div>
                                    {hoursInfo?.break > 0 && (
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-500">Break:</span>
                                            <span>{hoursInfo?.break.toFixed(2)}h</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between font-semibold">
                                        <span className="text-sm text-gray-500">Billable:</span>
                                        <span>{hoursInfo?.billable?.toFixed(2)}h</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center text-sm text-gray-500 mb-1">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    Time
                                </div>
                                <div className="font-medium text-gray-900">
                                    {timesheet?.attendance?.signInTime ? (
                                        <>
                                            <div>In: {format(new Date(timesheet.attendance.signInTime), 'HH:mm')}</div>
                                            {timesheet?.attendance?.signOutTime && (
                                                <div>Out: {format(new Date(timesheet.attendance.signOutTime), 'HH:mm')}</div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-gray-500">Not clocked in</span>
                                    )}
                                </div>
                            </div>

                            {timesheet?.rating ? (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center text-sm text-gray-500 mb-1">
                                        <Star className="h-4 w-4 mr-2 text-gray-400" />
                                        Rating
                                    </div>
                                    <div className="font-medium text-gray-900 flex items-center">
                                        <span>{timesheet?.rating}</span>
                                        <Star className="h-4 w-4 ml-1 text-yellow-400 fill-current" />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center text-sm text-gray-500 mb-1">
                                        <Home className="h-4 w-4 mr-2 text-gray-400" />
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {currentOrganization.type === 'home' ? timesheet?.home?.name : timesheet?.home?.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {canApproveAndReview(timesheet) && (
                            <div className="pt-2">
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-white text-primary border-primary hover:bg-primary/5"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onReview(timesheet);
                                        }}
                                    >
                                        Review
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onApprove(timesheet._id);
                                        }}
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );

}

export function EmployeeTimesheets() {
    const userState = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);
    const dispatch = useDispatch();
    const initialLimit = useMemo(() => calculatePaginationLimit(), []);

    // Scanner states
    const [isNative, setIsNative] = useState(false);
    const [showWebScanner, setShowWebScanner] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [sendScanedQrCode] = useScanBarcodeMutation();
    const [isScanning, setIsScanning] = useState(false);

    // QR Code Review states
    const [scannedBarcode, setScannedBarcode] = useState(null);
    const [employeeReviewData, setEmployeeReviewData] = useState(null);
    const [isEmployeeReviewOpen, setIsEmployeeReviewOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Invoice states
    const [invoiceSelectOpen, setInvoiceSelectOpen] = useState(false);
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [invoiceError, setInvoiceError] = useState('');
    const [invoiceData, setInvoiceData] = useState({
        timesheets: [],
        totalAmount: 0,
        home: {
            homeId: '',
            homeName: '',
            homeAddress: '',
            homeEmail: '',
            homePhone: ''
        }
    });
    const [invoiceStartDate, setInvoiceStartDate] = useState(startOfMonth(new Date()));
    const [invoiceEndDate, setInvoiceEndDate] = useState(endOfMonth(new Date()));
    const [isInvoiceFetching, setIsInvoiceFetching] = useState(false);
    const [invoiceTimesheets, setInvoiceTimesheets] = useState([]);
    const [selectedHomeId, setSelectedHomeId] = useState(null);

    // WebSocket states
    const [eventSource, setEventSource] = useState<EventSource | null>(null);
    const [connected, setConnected] = useState(false);
    const sseRef = useRef<EventSource | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout>();

    // Other states
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rateAndReviewDialogOpen, setRateAndReviewDialogOpen] = useState(false);
    const [currentTimesheet, setCurrentTimesheet] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        dateRange: {
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date())
        }
    });
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [timesheetSummary, setTimesheetSummary] = useState(null);

    // Queries
    const [getTimesheets, { data: timesheetResponse, isLoading }] = useLazyGetTimesheetsQuery();
    const [approveTimesheet] = useApproveTimesheetMutation();
    const [getInvoiceTimesheets] = useLazyGetTimesheetsQuery();
    const [calculateInvoice] = useLazyCalculateInvoiceQuery();
    const { data: linkedOrganizations = [] } = useGetLinkedOrganizationsQuery(
        currentOrganization.type === 'home' ? 'agency' : 'home'
    );

    const { data: careStaffs = [] } = useGetCareStaffsQuery();
    const { data: yourShiftPatterns = [] } = useGetShiftPatternsQuery(
        currentOrganization._id,
        { skip: !filterDialogOpen }
    );

    // Platform check effect
    useEffect(() => {
        const checkPlatform = async () => {
            const native = Capacitor.isNativePlatform();
            setIsNative(native);
            setIsSupported(true);
        };

        checkPlatform();
    }, []);

    // WebSocket connection effect
    useEffect(() => {
        const connectSSE = () => {
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }

            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }

            if (!isScanning) return;

            const sse = new EventSource(
                `${import.meta.env.VITE_APP_API_HOSTNAME}/api/v1/timesheet/timesheet-events?userId=${userState?._id}&orgId=${currentOrganization._id}`
            );

            sse.onopen = () => {
                setConnected(true);
            };

            sse.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleSSEMessage(data);
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            sse.onerror = (error) => {
                setConnected(false);
                sse.close();

                if (isScanning) {
                    reconnectTimeout.current = setTimeout(() => {
                        connectSSE();
                    }, 3000);
                }
            };

            sseRef.current = sse;
            setEventSource(sse);
        };

        connectSSE();

        return () => {
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            setEventSource(null);
            setConnected(false);
        };
    }, [isScanning, userState?._id, currentOrganization._id]);

    // Message handlers
    const handleSSEMessage = (data: any) => {
        const { type, payload } = data;

        switch (type) {
            case 'TIMESHEET_PROCESSED':
                setIsScanning(false);
                if (payload.status === 'success') {
                    toast.success('Timesheet processed successfully');
                    fetchTimesheets();
                } else {
                    toast.error('Failed to process timesheet');
                }
                break;
        }
    };

    // QR Code Approval
    const handleApproveAfterReview = async (timesheetId, { rating, review }) => {
        try {
            setIsApproving(true);

            // Include the scanned barcode in the approval request
            await approveTimesheet({
                timesheetId,
                rating,
                review,
                barcode: scannedBarcode
            }).unwrap();

            // Clear the barcode after successful approval
            setScannedBarcode(null);

            toast.success('Timesheet approved successfully');

            // Close the modal and refresh
            setIsEmployeeReviewOpen(false);
            setEmployeeReviewData(null);
            fetchTimesheets();
        } catch (error) {
            toast.error('Failed to approve timesheet');
        } finally {
            setIsApproving(false);
        }
    };

    // Scanner handlers
    const processScanResult = async (scannedValue: string) => {
        try {
            const [barcode, carerId] = scannedValue.split(':');

            // Send the scan and get employee data back
            const response = await sendScanedQrCode({
                barcode,
                carerId
            }).unwrap();

            // Store the barcode for approval later
            setScannedBarcode(barcode);

            // Store the employee data for review
            setEmployeeReviewData(response);
            setIsEmployeeReviewOpen(true);

            // We're done scanning, but not approving yet
            setIsScanning(false);
        } catch (error) {
            setIsScanning(false);
            console.error('Error processing QR code:', error);
            toast.error('Failed to process QR code. Please try again.');
        }
    };

    const handleNativeScan = async () => {
        try {
            setIsScanning(true);

            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: CapacitorBarcodeScannerTypeHint.ALL
            });

            if (result.ScanResult) {
                await processScanResult(result.ScanResult);
            } else {
                setIsScanning(false);
                toast.error('No QR code found. Please try again.');
            }
        } catch (error) {
            console.error('Native scanner error:', error);

            // Check if this is a user cancellation error (common pattern in Capacitor plugins)
            const errorMessage = error.message?.toLowerCase() || '';
            const isCancellationError =
                errorMessage.includes('cancel') ||
                errorMessage.includes('user did not scan') ||
                errorMessage.includes('dismissed') ||
                errorMessage.includes('closed');

            if (!isCancellationError) {
                // Only show error message for actual scanner errors, not user cancellations
                toast.error('Error accessing camera. Please check permissions.');
            }
        }
    };

    const handleWebScan = async (result: any) => {
        if (result) {
            await processScanResult(result?.text);
            setShowWebScanner(false);
        }
    };

    const handleWebScanError = (error: any) => {
        console.error('Web scanner error:', error);
        dispatch(
            showSnack({
                message: 'Error accessing camera',
                color: 'error'
            })
        );
    };

    const handleScanClick = () => {
        if (isNative) {
            handleNativeScan();
        } else {
            setShowWebScanner(true);
        }
    };

    // Invoice handlers
    const handleCreateInvoice = async () => {
        try {
            const result = await calculateInvoice({
                homeId: selectedHomeId,
                startDate: invoiceStartDate,
                endDate: invoiceEndDate
            }).unwrap();

            if (!result || !result.timesheets.length) {
                setInvoiceError(
                    'No approved timesheets found for the selected period.'
                );
                return;
            }

            const selectedHome = linkedOrganizations.find(
                (org) => org._id === selectedHomeId
            );

            setInvoiceData({
                ...result,
                home: {
                    homeId: selectedHome?._id || '',
                    homeName: selectedHome?.name || '',
                    homeAddress: selectedHome?.address || '',
                    homeEmail: selectedHome?.email || '',
                    homePhone: selectedHome?.phone || ''
                }
            });

            setInvoiceSelectOpen(false);
            setInvoiceDialogOpen(true);
        } catch (error) {
            console.error('Error calculating invoice:', error);
            setInvoiceError('Failed to calculate invoice. Please try again.');
            toast.error('Failed to calculate invoice. Please try again.');
        }
    };

    // Data fetching
    const fetchTimesheets = async () => {
        try {
            const params = {
                status: filterOptions.status === 'all' ? undefined : filterOptions.status,
                page: currentPage,
                limit: initialLimit,
                startDate: format(filterOptions.dateRange.from, 'yyyy-MM-dd'),
                endDate: format(filterOptions.dateRange.to, 'yyyy-MM-dd')
                // Removed other filters
            };

            await getTimesheets(params).unwrap();
        } catch (error) {
            console.error('Error fetching timesheets:', error);
            toast.error('Failed to fetch timesheets. Please try again.');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchTimesheets();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    useEffect(() => {
        fetchTimesheets();
    }, [
        currentPage,
        filterOptions.status,
        filterOptions.dateRange
    ]);

    const handleCalculateSummary = () => {
        setIsCalculating(true);

        // Use setTimeout to show loading state
        setTimeout(() => {
            const summary = generateTimesheetSummary(
                timesheetResponse?.data || [],
                filterOptions.dateRange
            );
            setTimesheetSummary(summary);
            setIsCalculating(false);
            setSummaryDialogOpen(true);
            setFilterDialogOpen(false);
        }, 500);
    };

    // Event Handlers
    const handleCardToggle = (timesheetId: string) => {
        setExpandedCards(prev =>
            prev.includes(timesheetId)
                ? prev.filter(id => id !== timesheetId)
                : [...prev, timesheetId]
        );
    };

    const handleApproveTimesheet = (timesheet) => {
        setCurrentTimesheet(timesheet);
        setRateAndReviewDialogOpen(true);
    };

    const handleApproveWithoutReview = async (timesheetId) => {
        try {
            await approveTimesheet({
                timesheetId,
                rating: null,
                review: null
            }).unwrap();

            toast.success('Timesheet approved successfully');

            fetchTimesheets();
        } catch (error) {
            dispatch(showSnack({
                message: error.data?.message || 'Error approving timesheet',
                color: 'error'
            }));
        }
    };

    const handleFilterChange = (field, value) => {
        setFilterOptions(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilterOptions({
            status: 'all',
            dateRange: {
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date())
            }
        });
        setCurrentPage(1);
    };

    const LoadingOverlay = ({ isVisible }) => {
        if (!isVisible) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    };

    const hasActiveFilters = () => {
        // Check if filter options differ from default values
        return (
            filterOptions.status !== 'all' ||
            filterOptions.dateRange.from.getTime() !== startOfMonth(new Date()).getTime() ||
            filterOptions.dateRange.to.getTime() !== endOfMonth(new Date()).getTime()
        );
    };

    return (
        <div className="flex flex-col">
            {/* Header Section */}
            <MobileHeader
                onFilterClick={() => setFilterDialogOpen(true)}
                onScanClick={handleScanClick}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                filterOptions={filterOptions}
                hasActiveFilters={hasActiveFilters()}
                isSupported={isSupported}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="space-y-4">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                            <p className="text-sm text-muted-foreground">Loading timesheets...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <TimesheetTable
                            timesheets={timesheetResponse?.data || []}
                            onApprove={handleApproveWithoutReview}
                            onReview={handleApproveTimesheet}
                            userState={userState}
                            currentOrganization={currentOrganization}
                            currentPage={currentPage}
                            totalItems={timesheetResponse?.pagination?.total || 0}
                            onPageChange={setCurrentPage}
                            itemsPerPage={initialLimit}
                        />

                        <div className="md:hidden space-y-2">
                            {(timesheetResponse?.data || []).length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <p className="text-lg font-medium text-gray-900">No timesheets found</p>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Try adjusting your search or filter criteria
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                timesheetResponse?.data.map((timesheet) => (
                                    <TimesheetCard
                                        key={timesheet._id}
                                        timesheet={timesheet}
                                        expanded={expandedCards.includes(timesheet._id)}
                                        onToggle={() => handleCardToggle(timesheet._id)}
                                        onApprove={handleApproveWithoutReview}
                                        onReview={handleApproveTimesheet}
                                        userState={userState}
                                        currentOrganization={currentOrganization}
                                    />
                                ))
                            )}
                            <MobilePagination
                                currentPage={currentPage}
                                totalItems={timesheetResponse?.pagination?.total || 0}
                                itemsPerPage={initialLimit}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Modals and Dialogs */}
            <FilterModal
                open={filterDialogOpen}
                onClose={() => setFilterDialogOpen(false)}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                onCalculate={handleCalculateSummary}
            />
            <SummaryModal
                open={summaryDialogOpen}
                onClose={() => setSummaryDialogOpen(false)}
                summary={timesheetSummary}
                loading={isCalculating}
            />
            {/* QR Scanner Modal */}
            {showWebScanner && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setShowWebScanner(false)}
                        />

                        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-auto sm:p-6 sm:align-middle">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <div className="flex items-center space-x-2">
                                    <Camera className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Scan QR Code
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowWebScanner(false)}
                                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mt-4">
                                <div className="w-64 h-64 mx-auto">
                                    <QrReader
                                        onResult={handleWebScan}
                                        onError={handleWebScanError}
                                        constraints={{ facingMode: 'environment' }}
                                        containerStyle={{
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowWebScanner(false)}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Review Modal for QR code scanning */}
            {/* <EmployeeReviewModal
                isOpen={isEmployeeReviewOpen}
                onClose={() => {
                    setIsEmployeeReviewOpen(false);
                    setEmployeeReviewData(null);
                }}
                employeeData={employeeReviewData}
                onApprove={handleApproveAfterReview}
                isLoading={isApproving}
            /> */}

            <LoadingOverlay isVisible={isRefreshing} />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <div className="space-y-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-gray-500">Loading timesheets...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeeTimesheets;