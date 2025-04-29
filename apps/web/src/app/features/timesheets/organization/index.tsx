import React, { useState, useEffect, useMemo } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Clock, Home, Calendar, Star, MessageSquare, DollarSign, MoreHorizontal, RotateCcw, Calculator } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useApproveTimesheetMutation, useDeleteTimesheetMutation, useInvalidateTimesheetMutation, useLazyGetTimesheetsQuery, useRejectTimesheetMutation } from '../timesheetApi';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { useLazyCalculateInvoiceQuery } from '../../invoice/invoiceApi';
import { useGetAgencyTemporaryHomesQuery, useGetLinkedOrganizationsQuery } from '../../organization/organizationApi';
import { useGetOtherOrganizationShiftPatternsQuery, useGetShiftPatternQuery } from '../../shift-pattern/shiftPatternsApi';
import { useGetCareStaffsQuery } from '../../staffs/staffsApi';
import { toast } from 'react-toastify';
import { selectCurrentOrganization, selectUser } from '../../auth/AuthSlice';
import FilterModal from './org-filter';
interface FilterOptions {
    organizationId: string;
    careUserId: string;
    startDate: Date;
    endDate: Date;
    shiftPatternId: string;
}



// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
        pending: 'bg-amber-100 text-amber-800',
        approved: 'bg-primary-100 text-primary-800',
        rejected: 'bg-red-100 text-red-800',
        invalidated: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
};

const StatusInvoiceBadge = ({ status }: { status: string }) => {

    const statusConfig = {
        pending_invoice: 'bg-amber-100 text-amber-800',
        invoiced: 'bg-primary-100 text-primary-800',
        approved: 'bg-primary-100 text-primary-800',
        rejected: 'bg-red-100 text-red-800',
        draft: 'bg-gray-100 text-gray-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
            {/* {status?.charAt(0).toUpperCase() + status?.slice(1)} */}

            {
                status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft'
            }
        </span>
    );
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


// Table View Component
const TimesheetTable = ({
    timesheets,
    onApprove,
    onReview,
    onReject,
    onInvalidate,
    onDelete,
    userState,
    currentOrganization,
    currentPage,
    totalItems,
    onPageChange,
    itemsPerPage
}) => {
    const TimesheetActions = ({ timesheet }) => {
        const isAdmin = userState?.role === 'admin';
        const isHomeAdmin = isAdmin && currentOrganization?.type === 'home';
        const isAgencyAdmin = isAdmin && currentOrganization?.type === 'agency';
        const isHomeNurse = userState?.role === 'nurse' && currentOrganization?.type === 'home';
        const isPending = timesheet.status === 'pending';
        const isApproved = timesheet.status === 'approved';
        const isRejected = timesheet.status === 'rejected';
        const isInvalidated = timesheet.status === 'invalidated';
        const isNotCarerForTimesheet = userState._id !== timesheet?.carerDetails?._id;

        // Check if any actions are available
        const hasAvailableActions = isHomeAdmin || isAgencyAdmin || (isHomeNurse && isPending && isNotCarerForTimesheet);

        if (!hasAvailableActions) {
            return null;
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="bg-white">
                    {/* Approve/Reject actions - available for pending timesheets when HOME admin/nurse */}
                    {isPending && ((isHomeAdmin || isHomeNurse) && isNotCarerForTimesheet) && (
                        <>
                            <DropdownMenuItem onClick={() => onApprove(timesheet._id)}>
                                Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onReject(timesheet._id)}>
                                Reject
                            </DropdownMenuItem>
                        </>
                    )}

                    {/* Invalidate action - available for approved or rejected timesheets when any admin */}
                    {(isHomeAdmin || isAgencyAdmin) && (isApproved || isRejected) && !isInvalidated && (
                        <DropdownMenuItem onClick={() => onInvalidate(timesheet._id)}>
                            Invalidate
                        </DropdownMenuItem>
                    )}

                    {/* Delete action - for any admins (home or agency) */}
                    {(isHomeAdmin || isAgencyAdmin) && (
                        // Can delete pending timesheets directly
                        // Can delete approved/rejected timesheets only after invalidation
                        // Can always delete invalidated timesheets
                        isPending || isInvalidated || ((isApproved || isRejected) && isInvalidated) ? (
                            <DropdownMenuItem onClick={() => onDelete(timesheet._id)}>
                                Delete
                            </DropdownMenuItem>
                        ) : null
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div className="hidden md:block">
            <Card className="hidden md:flex flex-col flex-1bg-gray-50 border-gray-200 rounded-lg shadow-lg p-3">
                <CardContent className="p-0">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>
                                        {
                                            currentOrganization?.type === 'home' ? 'Agency' : 'Home'
                                        }
                                    </TableHead>
                                    <TableHead>Date & Shift</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Invoice Status</TableHead>
                                    {/* <TableHead>Rating</TableHead> */}
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Clock In/Out</TableHead>
                                    <TableHead>Signature</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timesheets.map((timesheet) => {
                                    const isWeekend = moment(timesheet?.shift?.date).isoWeekday() > 5;
                                    const isEmergency = timesheet?.shift?.isEmergency;
                                    let carerPay = 0;
                                    let homeRate = 0;

                                    if (userState?.role === 'admin' || userState?.role === 'owner') {
                                        // Normalize the carer role to handle different formats
                                        const carerRoleRaw = timesheet?.carerDetails?.role || '';
                                        const homeId = timesheet?.shift?.homeId;

                                        // Handle different role formats (senior_carer vs Senior Carer)
                                        let carerRole = carerRoleRaw.toLowerCase();
                                        if (carerRole === 'senior_carer') {
                                            carerRole = 'senior carer';
                                        }

                                        // Find the home rate specifically for this carer's role and home
                                        const homeRateObj = timesheet?.shiftPatternData?.rates?.find(
                                            (rate) => {
                                                const rateUserType = (rate?.userType || '').toLowerCase();
                                                return rate?.careHomeId === homeId && rateUserType === carerRole;
                                            }
                                        );

                                        if (homeRateObj) {
                                            homeRate = isEmergency
                                                ? (isWeekend ? homeRateObj.emergencyWeekendRate : homeRateObj.emergencyWeekdayRate)
                                                : (isWeekend ? homeRateObj.weekendRate : homeRateObj.weekdayRate);
                                        }

                                        // Find the staff payment rate for this carer's role
                                        const userRateObj = timesheet?.shiftPatternData?.userTypeRates?.find(
                                            (rate) => {
                                                const rateUserType = (rate.userType || '').toLowerCase();
                                                return rateUserType === carerRole;
                                            }
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
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage
                                                            src={timesheet.carerDetails?.avatarUrl}
                                                            alt={`${timesheet?.carerDetails?.firstName} ${timesheet?.carerDetails?.lastName}`}
                                                            className='object-scale-down'
                                                        />
                                                        <AvatarFallback>
                                                            {timesheet?.carerDetails?.firstName?.[0]}
                                                            {timesheet?.carerDetails?.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{timesheet?.carerDetails?.firstName} {timesheet?.carerDetails?.lastName}</div>
                                                        <div className="text-sm text-gray-500">{timesheet?.carerDetails?.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {currentOrganization?.type === 'home' ? timesheet?.agency?.name : timesheet?.home?.name}
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
                                                    <Badge variant="success">Regular</Badge>
                                                )
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <StatusInvoiceBadge status={timesheet.invoiceStatus} />
                                            </TableCell>
                                            {/* <TableCell>
                                                {timesheet.rating ? (
                                                    <div className="flex items-center">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                        <span className="ml-1">{timesheet.rating}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell> */}
                                            <TableCell>
                                                {userState.currentOrganization?.type === 'home' ? (
                                                    <span>£{homeRate.toFixed(2)}</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div>Staff: £{carerPay.toFixed(2)}</div>
                                                        <div>Home: £{homeRate.toFixed(2)}</div>
                                                    </div>
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
                                                {timesheet.signature?.downloadUrl ? (
                                                    <div className="space-y-1">
                                                        <img
                                                            src={timesheet.signature.downloadUrl}
                                                            alt="Signature"
                                                            className="h-10 max-w-[150px] object-contain"
                                                        />
                                                        <div className="text-xs text-gray-500">
                                                            {timesheet.signature.signerName} ({timesheet.signature.signerRole})
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {
                                                            timesheet?.tokenForQrCode ? (
                                                                <div>
                                                                    {/* Barcode scanned */}
                                                                    <Clock className="h-4 w-4" />
                                                                    <span>Scanned</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-500">No signature</span>
                                                            )
                                                        }
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TimesheetActions timesheet={timesheet} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Improved Table Pagination with Ellipsis */}
                    <div className="border-t border-gray-200 p-4 rounded-xl bg-gray-100">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                                {totalItems} results
                            </p>

                            <Pagination>
                                <PaginationContent className='ml-auto'>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            className={`${currentPage > 1 ? 'cursor-pointer hover:bg-primary' : 'cursor-not-allowed opacity-50'}`}
                                            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                                        />
                                    </PaginationItem>

                                    {(() => {
                                        const totalPages = Math.ceil(totalItems / itemsPerPage);
                                        let pagesToShow = [];

                                        if (totalPages <= 7) {
                                            // Show all pages if 7 or fewer
                                            pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                        } else {
                                            // Show a subset of pages with current page in middle when possible
                                            if (currentPage <= 4) {
                                                // Near start
                                                pagesToShow = [1, 2, 3, 4, 5, '...', totalPages];
                                            } else if (currentPage >= totalPages - 3) {
                                                // Near end
                                                pagesToShow = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                            } else {
                                                // Middle
                                                pagesToShow = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                                            }
                                        }

                                        return pagesToShow.map((page, index) => {
                                            if (page === '...') {
                                                return (
                                                    <PaginationItem key={`ellipsis-${index}`}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                );
                                            }

                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        className="cursor-pointer hover:bg-primary"
                                                        onClick={() => onPageChange(page)}
                                                        isActive={currentPage === page}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        });
                                    })()}

                                    <PaginationItem>
                                        <PaginationNext
                                            className={`${currentPage < Math.ceil(totalItems / itemsPerPage) ? 'cursor-pointer hover:bg-primary' : 'cursor-not-allowed opacity-50'}`}
                                            onClick={() => currentPage < Math.ceil(totalItems / itemsPerPage) && onPageChange(currentPage + 1)}
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
const TimesheetCard = ({
    timesheet,
    expanded,
    onToggle,
    onApprove,
    onReview,
    onReject,
    onInvalidate,
    onDelete,
    userState,
    currentOrganization
}) => {
    // Define user roles and timesheet states
    const isAdmin = userState?.role === 'admin';
    const isHomeAdmin = isAdmin && currentOrganization?.type === 'home';
    const isAgencyAdmin = isAdmin && currentOrganization?.type === 'agency';
    const isHomeNurse = userState?.role === 'nurse' && currentOrganization?.type === 'home';
    const isPending = timesheet?.status === 'pending';
    const isApproved = timesheet?.status === 'approved';
    const isRejected = timesheet?.status === 'rejected';
    const isInvalidated = timesheet?.status === 'invalidated';
    const isNotCarerForTimesheet = userState._id !== timesheet?.carerDetails?._id;
    const isWeekend = moment(timesheet?.shift?.date).isoWeekday() > 5;
    const isEmergency = timesheet?.shift?.isEmergency;

    // Calculate rates if user is admin
    let carerPay = 0;
    let homeRate = 0;

    if (userState?.role === 'admin') {
        // Normalize the carer role to handle different formats
        const carerRoleRaw = timesheet?.carerDetails?.role || '';
        const homeId = timesheet?.shift?.homeId;

        // Handle different role formats (senior_carer vs Senior Carer)
        let carerRole = carerRoleRaw.toLowerCase();
        if (carerRole === 'senior_carer') {
            carerRole = 'senior carer';
        }

        // Find the home rate specifically for this carer's role and home
        const homeRateObj = timesheet?.shiftPatternData?.rates?.find(
            (rate) => {
                const rateUserType = (rate?.userType || '').toLowerCase();
                return rate?.careHomeId === homeId && rateUserType === carerRole;
            }
        );

        if (homeRateObj) {
            homeRate = isEmergency
                ? (isWeekend ? homeRateObj.emergencyWeekendRate : homeRateObj.emergencyWeekdayRate)
                : (isWeekend ? homeRateObj.weekendRate : homeRateObj.weekdayRate);
        }

        // Find the staff payment rate for this carer's role
        const userRateObj = timesheet?.shiftPatternData?.userTypeRates?.find(
            (rate) => {
                const rateUserType = (rate.userType || '').toLowerCase();
                return rateUserType === carerRole;
            }
        );

        if (userRateObj) {
            carerPay = isEmergency
                ? (isWeekend ? userRateObj.emergencyWeekendRate : userRateObj.emergencyWeekdayRate)
                : (isWeekend ? userRateObj.weekendRate : userRateObj.weekdayRate);
        }
    }

    // Only home admins and nurses can approve/review/reject
    const canApproveAndReview = () => {
        return (
            ((isHomeAdmin || isHomeNurse) &&
                isPending &&
                isNotCarerForTimesheet)
        );
    };

    return (
        <Card className={`${timesheet?.shift?.isEmergency ? 'border-l-4 border-l-red-500' : ''} mb-3`}>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={timesheet?._id} className="border-0">
                    {/* Header - Always Visible */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                                    {/* {timesheet?.carerDetails?.firstName || timesheet?.carerDetails?.lastName ? (
                                        <img
                                            src={timesheet.carer?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(timesheet?.carerDetails?.firstName || "_")}+${encodeURIComponent(timesheet?.carerDetails?.lastName || "_")}&background=random`}
                                            alt={`${timesheet?.carerDetails?.firstName || ""} ${timesheet?.carerDetails?.lastName || ""}`}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(timesheet?.carerDetails?.firstName || "_")}+${encodeURIComponent(timesheet?.carerDetails?.lastName || "_")}&background=random`;
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600 font-medium">
                                            ?
                                        </div>
                                    )} */}
                                    {/* <Avatar>
                                        <AvatarImage src={timesheet.carer?.avatarUrl} fallback={<AvatarFallback>{timesheet?.carerDetails?.firstName?.charAt(0)}{timesheet?.carerDetails?.lastName?.charAt(0)}</AvatarFallback>} />
                                    </Avatar> */}

                                    <Avatar className="h-12 w-12">
                                        <AvatarImage
                                            src={timesheet.carer?.avatarUrl}
                                            className='object-scale-down'
                                            alt={`${timesheet?.carerDetails?.firstName} ${timesheet?.carerDetails?.lastName}`}
                                        />
                                        <AvatarFallback>
                                            {timesheet?.carerDetails?.firstName?.[0]}
                                            {timesheet?.carerDetails?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium">{timesheet?.carerDetails?.firstName} {timesheet?.carerDetails?.lastName}</h3>
                                <div className="text-xs text-gray-500 mt-1">{timesheet?.carerDetails?.email}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={timesheet?.status} />
                            <AccordionTrigger className="p-0 hover:no-underline">
                            </AccordionTrigger>
                        </div>
                    </div>

                    {/* Basic info visible always below header */}
                    <div className="px-4 pb-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex flex-col">
                                <span className="text-gray-500">Home/Agency</span>
                                <span className="font-medium">
                                    {currentOrganization?.type === 'home' ? timesheet?.agency?.name : timesheet?.home?.name}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium">
                                    {format(new Date(timesheet?.shift?.date), 'dd MMM yyyy')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500">Shift</span>
                                <span className="font-medium">
                                    {timesheet?.shiftPatternData?.name}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-500">Type</span>
                                <span>
                                    {timesheet?.shift?.isEmergency ? (
                                        <Badge variant='destructive' className='bg-red-400 text-white'>Emergency</Badge>
                                    ) : (
                                        <Badge variant="success">Regular</Badge>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Content */}
                    <AccordionContent>
                        <CardContent className="pt-0 pb-4 px-4">
                            <Separator className="mb-4" />

                            {/* Expanded detailed information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Invoice Status</span>
                                    <StatusInvoiceBadge status={timesheet.invoiceStatus} />
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Clock In/Out</span>
                                    {timesheet?.attendance?.signInTime ? (
                                        <div className="text-sm">
                                            <div>In: {format(new Date(timesheet.attendance.signInTime), 'HH:mm')}</div>
                                            {timesheet?.attendance?.signOutTime && (
                                                <div>Out: {format(new Date(timesheet.attendance.signOutTime), 'HH:mm')}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500">Not clocked in</span>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-sm">Rate</span>
                                    {userState.currentOrganization?.type === 'home' ? (
                                        <span className="font-medium">£{homeRate.toFixed(2)}</span>
                                    ) : (
                                        <div className="text-sm">
                                            <div>Staff: £{carerPay.toFixed(2)}</div>
                                            <div>Home: £{homeRate.toFixed(2)}</div>
                                        </div>
                                    )}
                                </div>

                                {timesheet?.rating && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Rating</span>
                                        <div className="flex items-center">
                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span className="ml-1">{timesheet.rating}</span>
                                        </div>
                                    </div>
                                )}

                                {timesheet?.createdAt && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Created</span>
                                        <span>{format(new Date(timesheet.createdAt), 'dd MMM yyyy HH:mm')}</span>
                                    </div>
                                )}

                                {timesheet?.updatedAt && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Updated</span>
                                        <span>{format(new Date(timesheet.updatedAt), 'dd MMM yyyy HH:mm')}</span>
                                    </div>
                                )}

                                {timesheet?.approvedAt && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Approved</span>
                                        <span>{format(new Date(timesheet.approvedAt), 'dd MMM yyyy HH:mm')}</span>
                                    </div>
                                )}

                                {timesheet?.rejectedAt && (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Rejected</span>
                                        <span>{format(new Date(timesheet.rejectedAt), 'dd MMM yyyy HH:mm')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Signature section if available */}
                            {timesheet.signature?.downloadUrl && (
                                <div className="mt-3">
                                    <span className="text-gray-500 text-sm">Signature</span>
                                    <div className="flex flex-col items-center mt-1 p-2 border rounded bg-gray-50">
                                        <img
                                            src={timesheet.signature.downloadUrl}
                                            alt="Signature"
                                            className="max-h-16 object-contain"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                            {timesheet.signature.signerName} ({timesheet.signature.signerRole})
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes section if available */}
                            {timesheet.notes && (
                                <div className="mt-3">
                                    <span className="text-gray-500 text-sm">Notes</span>
                                    <p className="text-sm mt-1 p-2 border rounded bg-gray-50">
                                        {timesheet.notes}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-4 flex-wrap">
                                {/* Approve/Reject/Review actions - only for home admins and nurses with pending timesheets */}
                                {canApproveAndReview() && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReview(timesheet);
                                            }}
                                        >
                                            Review
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onApprove(timesheet?._id);
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReject(timesheet?._id);
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {/* Invalidate action - for any admin with approved or rejected timesheets */}
                                {(isHomeAdmin || isAgencyAdmin) && (isApproved || isRejected) && !isInvalidated && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onInvalidate(timesheet?._id);
                                        }}
                                    >
                                        Invalidate
                                    </Button>
                                )}

                                {/* Delete action - for any admin with pending or invalidated timesheets */}
                                {(isHomeAdmin || isAgencyAdmin) &&
                                    (isPending || isInvalidated || ((isApproved || isRejected) && isInvalidated)) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(timesheet?._id);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    )}
                            </div>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};
// Main Component (continued)
export function OrganizationTimesheets() {
    const userState = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);
    const dispatch = useDispatch();

    const initialLimit = useMemo(() => calculatePaginationLimit(), []);


    //invoicing
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

    const [invoiceStartDate, setInvoiceStartDate] = useState(
        startOfMonth(new Date())
    );

    const [invoiceEndDate, setInvoiceEndDate] = useState(endOfMonth(new Date()));
    const [isInvoiceFetching, setIsInvoiceFetching] = useState(false);
    const [invoiceTimesheets, setInvoiceTimesheets] = useState([]);

    const [getInvoiceTimesheets] = useLazyGetTimesheetsQuery();
    const [calculateInvoice] = useLazyCalculateInvoiceQuery();

    const [selectedHomeId, setSelectedHomeId] = useState(null);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showStaffReportModal, setShowStaffReportModal] = useState(false);
    const [staffReportError, setStaffReportError] = useState('');
    const [isStaffReportLoading, setIsStaffReportLoading] = useState(false);



    // States
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [expandedCards, setExpandedCards] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState(0);
    const [rateAndReviewDialogOpen, setRateAndReviewDialogOpen] = useState(false);
    const [currentTimesheet, setCurrentTimesheet] = useState(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        organizationId: 'all',
        careUserId: 'all',
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        shiftPatternId: '',
        status: 'all',
        invoiceStatus: 'all',
        isEmergency: null,
        carerRole: 'all'
    });

    const [staffPaymentData, setStaffPaymentData] = useState(null);
    const [openStaffPaymentDialog, setOpenStaffPaymentDialog] = useState(false);

    // Queries
    const [getTimesheets, { data: timesheetResponse, isLoading }] = useLazyGetTimesheetsQuery();
    const [approveTimesheet] = useApproveTimesheetMutation();
    const [rejectTimesheet] = useRejectTimesheetMutation();

    const { data: tempHomes } = useGetAgencyTemporaryHomesQuery(
        undefined,
        { skip: currentOrganization?.type !== 'agency' }
    );

    const { data: linkedOrganizations = [] } = useGetLinkedOrganizationsQuery(currentOrganization?.type === 'home' ? 'agency' : 'home');
    const { data: otherShiftPatterns = [] } = useGetOtherOrganizationShiftPatternsQuery(
        filterOptions.organizationId,
        {
            skip: filterOptions.organizationId === 'all' || filterOptions.organizationId === currentOrganization?._id
        }
    );
    const { data: careStaffs = [] } = useGetCareStaffsQuery();
    const { data: yourShiftPatterns = [] } = useGetShiftPatternQuery(
        currentOrganization?._id as any,
        { skip: !filterDialogOpen }
    );

    // const [generateStaffPaymentReport] = useGenerateStaffPaymentReportMutation();
    const allOrganizations = useMemo(() => {

        const linkedOrgs = linkedOrganizations?.data || [];

        if (currentOrganization?.type !== 'agency') {
            return linkedOrgs;
        }

        // Format temporary homes to match organization structure
        let formattedTempHomes = [];

        if (
            tempHomes && tempHomes?.data.length > 0
        ) {
            formattedTempHomes = tempHomes?.data?.map(home => ({
                _id: home._id,
                name: `${home.name} (Temporary)`,
                email: home.email || '',
                type: 'home',
                isTemporaryHome: true,
                address: home.address || null
            }));
        }

        return [...linkedOrgs, ...formattedTempHomes];
    }, [linkedOrganizations, tempHomes, currentOrganization?.type]);

    const handleStaffReportSubmit = async (staffIds, startDate, endDate) => {
        try {
            setIsStaffReportLoading(true);

            // This is just a placeholder. We'll implement the actual API call later
            console.log('Generating staff payment report for:', {
                staffIds,
                startDate,
                endDate
            });

            // Generate the staff payment report
            // const report = await generateStaffPaymentReport({
            //     staffIds,
            //     startDate,
            //     endDate
            // }).unwrap();

            setShowStaffReportModal(false);
            setStaffReportError('');

            // setStaffPaymentData(report.data);
            setOpenStaffPaymentDialog(true);

            toast.success('Staff payment report generated successfully!');


        } catch (error) {
            console.error('Error generating staff payment report:', error);
            setStaffReportError('Failed to generate the staff payment report. Please try again.');
        } finally {
            setIsStaffReportLoading(false);
        }
    };


    // Data Fetching
    const fetchTimesheets = async (

    ) => {
        try {
            const params = {
                status: filterOptions.status,
                page: currentPage,
                limit: initialLimit,
                startDate: format(filterOptions.startDate, 'yyyy-MM-dd'),
                endDate: format(filterOptions.endDate, 'yyyy-MM-dd'),
                organizationId: filterOptions.organizationId === 'all' ? undefined : filterOptions.organizationId,
                // Add missing filter parameters
                invoiceStatus: filterOptions.invoiceStatus === 'all' ? undefined : filterOptions.invoiceStatus,
                isEmergency: filterOptions.isEmergency === null ? undefined : filterOptions.isEmergency,
                carerRole: filterOptions.carerRole === 'all' ? undefined : filterOptions.carerRole,
                careUserId: filterOptions.careUserId === 'all' ? undefined : filterOptions.careUserId,
                shiftPatternId: filterOptions.shiftPatternDataId || undefined,
            };

            await getTimesheets(params).unwrap();
        } catch (error) {
            console.error('Error fetching timesheets:', error);
            toast.error('Failed to fetch timesheets. Please try again.');
        }
    };

    useEffect(() => {
        fetchTimesheets(
        );
    }, [
        currentPage,
        activeTab,
        filterOptions.organizationId,
        filterOptions.startDate,
        filterOptions.endDate,
        filterOptions.invoiceStatus,
        filterOptions.isEmergency,
        filterOptions.carerRole,
        filterOptions.careUserId,
        filterOptions.shiftPatternDataId,
        filterOptions.status
    ]);

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


    const handleRejectTimesheet = async (timesheetId) => {
        try {
            await rejectTimesheet(timesheetId).unwrap();
            dispatch(showSnack({
                message: 'Timesheet rejected successfully',
                color: 'success'
            }));

            // Refresh data
            fetchTimesheets();
        } catch (error) {
            toast.error(error.data?.message || 'Error rejecting timesheet');
        }
    }


    const handleApproveWithoutReview = async (timesheetId) => {
        try {
            await approveTimesheet({
                timesheetId,
                rating: null,
                review: null
            }).unwrap();

            toast.success('Timesheet approved successfully');

            // Refresh data
            fetchTimesheets();
        } catch (error) {
            toast.error(error.data?.message || 'Error approving timesheet');
        }
    };

    const handleFilterChange = (field: keyof FilterOptions, value: any) => {
        console.log('field:', field, 'value:', value);
        setFilterOptions(prev => ({
            ...prev,
            [field]: value
        }));
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilterOptions({
            organizationId: 'all',
            careUserId: 'all',
            startDate: startOfMonth(new Date()),
            endDate: endOfMonth(new Date()),
            shiftPatternId: '',
            status: 'all',
            invoiceStatus: 'all',
            isEmergency: null,
            carerRole: 'all'
        });
        setCurrentPage(1);
    };



    const [invalidateTimesheet] = useInvalidateTimesheetMutation();
    const [deleteTimesheet] = useDeleteTimesheetMutation();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // refresh for 1 second with a sample timeout 

        await fetchTimesheets();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    // In OrganizationTimesheets component
    const handleInvoiceSubmit = async (
        homeId: string,
        startDate: Date,
        endDate: Date,
        holidays: Date[]
    ) => {
        try {
            setIsInvoiceFetching(true);
            setSelectedHomeId(homeId);

            const result = await calculateInvoice({
                homeId,
                startDate,
                endDate,
                holidays
            }).unwrap();

            if (!result || !result.timesheets.length) {
                setInvoiceError(
                    'No approved timesheets found for the selected period for the selected care home.'
                );
                setIsInvoiceFetching(false);
                return;
            }

            // Find the selected organization from either regular or temporary homes
            const selectedHome = allOrganizations.find(
                (org) => org._id === homeId
            );

            setInvoiceData({
                ...result,
                isTemporaryHome: selectedHome?.isTemporaryHome || false,
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
            setIsInvoiceFetching(false);
        } catch (error) {
            console.error('Error calculating invoice:', error);
            setInvoiceError('Failed to calculate invoice. Please try again.');
            toast.error(error.data?.message || 'Error calculating invoice');
            setIsInvoiceFetching(false);
        }
    };

    const handleInvalidateTimesheet = async (timesheetId) => {
        try {
            await invalidateTimesheet(timesheetId).unwrap();
            toast.success('Timesheet invalidated successfully');

            // Refresh data
            fetchTimesheets();
        } catch (error) {
            toast.error(error.data?.message || 'Error invalidating timesheet');
        }
    };

    const handleDeleteTimesheet = async (timesheetId) => {
        try {
            await deleteTimesheet(timesheetId).unwrap();
            toast.success('Timesheet deleted successfully');

            // Refresh data
            fetchTimesheets();
        } catch (error) {
            toast.error(error.data?.message || 'Error deleting timesheet');
        }
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

    return (
        <div className="flex flex-col flex-1 flex-grow">
            {/* Header Section */}
            {/* Header Section - Updated for better mobile responsiveness */}
            <div className="">
                <div className="border-b">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-2">
                        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterDialogOpen(true)}
                                className="relative"
                            >
                                <Filter className="h-4 w-4 " />
                                Filter
                                {(filterOptions.organizationId !== 'all' ||
                                    filterOptions.careUserId !== 'all' ||
                                    filterOptions.status !== 'all' ||
                                    filterOptions.invoiceStatus !== 'all' ||
                                    filterOptions.isEmergency !== null ||
                                    filterOptions.carerRole !== 'all' ||
                                    filterOptions.shiftPatternDataId !== '' ||
                                    format(filterOptions.startDate, 'yyyy-MM-dd') !== format(startOfMonth(new Date()), 'yyyy-MM-dd') ||
                                    format(filterOptions.endDate, 'yyyy-MM-dd') !== format(endOfMonth(new Date()), 'yyyy-MM-dd')) && (
                                        <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                            !
                                        </span>
                                    )}
                            </Button>

                            {currentOrganization?.type === 'agency' && (
                                <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                                    <Clock className="h-4 w-4 " />
                                    Upload
                                </Button>
                            )}

                            {currentOrganization?.type === 'agency' && userState?.role === 'admin' && (
                                <Button variant="outline" size="sm" onClick={() => setInvoiceSelectOpen(true)}>
                                    <DollarSign className="h-4 w-4 " />
                                    Create Invoice
                                </Button>
                            )}

                            {userState?.role === 'admin' && (
                                <Button variant="outline" size="sm" onClick={() => setShowStaffReportModal(true)}>
                                    <Calculator className="h-4 w-4 mr-1" />
                                    Staff Payments
                                </Button>
                            )}
                        </div>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleRefresh}
                        >
                            <RotateCcw />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div >
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
                        {/* Desktop View */}
                        <TimesheetTable
                            timesheets={timesheetResponse?.data || []}
                            onApprove={handleApproveWithoutReview}
                            onReview={handleApproveTimesheet}
                            onReject={handleRejectTimesheet}
                            onInvalidate={handleInvalidateTimesheet}
                            onDelete={handleDeleteTimesheet}
                            userState={userState}
                            currentOrganization={currentOrganization}
                            currentPage={currentPage}
                            totalItems={timesheetResponse?.pagination?.total || 0}
                            onPageChange={setCurrentPage}
                            itemsPerPage={initialLimit}
                        />
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
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
                                        onReject={handleRejectTimesheet}
                                        onInvalidate={handleInvalidateTimesheet}
                                        onDelete={handleDeleteTimesheet}
                                        userState={userState}
                                        currentOrganization={currentOrganization}
                                    />
                                ))
                            )}
                            {/* Improved Mobile Pagination */}
                            <div className="md:hidden border-t p-0">
                                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                                    <Pagination className="flex justify-center w-full">
                                        <PaginationContent className="flex flex-wrap justify-center gap-1">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    className={`cursor-pointer hover:bg-primary ${currentPage <= 1 ? 'pointer-events-none' : ''}`}
                                                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                                />
                                            </PaginationItem>

                                            {/* Dynamic pagination that shows limited pages based on current page */}
                                            {(() => {
                                                const totalPages = timesheetResponse?.pagination?.totalPages || 1;
                                                let pagesToShow = [];

                                                if (totalPages <= 5) {
                                                    // Show all pages if 5 or fewer
                                                    pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                                } else {
                                                    // Show a subset of pages with current page in middle when possible
                                                    if (currentPage <= 3) {
                                                        // Near start
                                                        pagesToShow = [1, 2, 3, 4, '...', totalPages];
                                                    } else if (currentPage >= totalPages - 2) {
                                                        // Near end
                                                        pagesToShow = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                                    } else {
                                                        // Middle
                                                        pagesToShow = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                                                    }
                                                }

                                                return pagesToShow.map((page, index) => {
                                                    if (page === '...') {
                                                        return (
                                                            <PaginationItem key={`ellipsis-${index}`}>
                                                                <span className="px-2 py-1 text-sm text-gray-400">...</span>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                className="cursor-pointer hover:bg-primary h-8 w-8 p-0 flex items-center justify-center text-sm"
                                                                onClick={() => setCurrentPage(page)}
                                                                isActive={currentPage === page}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                });
                                            })()}

                                            <PaginationItem>
                                                <PaginationNext
                                                    className={`cursor-pointer hover:bg-primary ${currentPage >= (timesheetResponse?.pagination?.totalPages || 1) ? 'opacity-50 pointer-events-none' : ''}`}
                                                    onClick={() => currentPage < (timesheetResponse?.pagination?.totalPages || 1) && setCurrentPage(currentPage + 1)}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* Filter Modal */}
            <FilterModal
                open={filterDialogOpen}
                onClose={() => setFilterDialogOpen(false)}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                organizations={
                    [
                        ...allOrganizations,
                    ]
                }
                careStaffs={careStaffs}
                shiftPatterns={yourShiftPatterns}
                otherShiftPatterns={
                    currentOrganization?.type === 'home' && filterOptions.organizationId !== currentOrganization?._id ? otherShiftPatterns : []
                }
            />

            {/* <TimeSheetManualUpload
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
            /> */}

            {/* Loading State */}
            {
                isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <div className="space-y-4">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm text-gray-500">Loading timesheets...</p>
                        </div>
                    </div>
                )
            }

            {/* <InvoiceSelectionModal
                open={invoiceSelectOpen}
                onClose={() => setInvoiceSelectOpen(false)}
                onSubmit={handleInvoiceSubmit}
                linkedOrganizations={allOrganizations}
                isLoading={isInvoiceFetching}
                error={invoiceError}
            />

            <InvoiceDialog
                open={invoiceDialogOpen}
                onClose={() => setInvoiceDialogOpen(false)}
                metaData={invoiceData}
                timesheets={invoiceData.timesheets}
                totalAmount={invoiceData.totalAmount}
                home={invoiceData.home}
                selectedStartDate={filterOptions.startDate.toISOString()}
                selectedEndDate={filterOptions.endDate.toISOString()}
            />
            <StaffPaymentReportModal
                open={showStaffReportModal}
                onClose={() => setShowStaffReportModal(false)}
                onSubmit={handleStaffReportSubmit}
                careStaffs={careStaffs}
                isLoading={isStaffReportLoading}
                error={staffReportError}
            /> */}

            {/* {
                openStaffPaymentDialog && staffPaymentData !== null &&
                <StaffPaymentDialog
                    open={
                        openStaffPaymentDialog && staffPaymentData !== null
                    }
                    onClose={
                        () => setOpenStaffPaymentDialog(false)
                    }
                    paymentData={
                        staffPaymentData
                    }
                />} */}
            <LoadingOverlay isVisible={isRefreshing} />
        </div >
    );
}

export default OrganizationTimesheets;