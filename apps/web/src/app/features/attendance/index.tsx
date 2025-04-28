import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Edit, History, RefreshCw, Search, Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useGetAttendanceRegistryQuery, useGetLinkedAgenciesQuery } from './attendanceApi';
import { useSelector } from 'react-redux';
import { selectCurrentOrganization, selectUser } from '../auth/AuthSlice';

// Calculate pagination limit based on screen size
const calculatePaginationLimit = () => {
    const screenHeight = window.innerHeight;
    const availableHeight = screenHeight - 300;
    const possibleRows = Math.floor(availableHeight / 73);

    if (screenHeight < 768) return 7;
    if (screenHeight < 900) return 9;
    if (screenHeight < 1080) return 10;
    return 12;
};

const statusConfig = {
    pending: {
        className: 'bg-amber-100 text-amber-800 border-amber-300',
        label: 'Pending'
    },
    signedIn: {
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'Clocked In'
    },
    signedOut: {
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'Clocked Out'
    },
    absent: {
        className: 'bg-red-100 text-red-800 border-red-300',
        label: 'Absent'
    },
    late: {
        className: 'bg-purple-100 text-purple-800 border-purple-300',
        label: 'Late'
    }
};

type StatusKey = keyof typeof statusConfig;

const getStatusInfo = (status: StatusKey | string) => {
    return statusConfig[status as StatusKey] || {
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        label: status.charAt(0).toUpperCase() + status.slice(1)
    };
};

// Table Row Component
const AttendanceTableRow: React.FC<{
    record: any;
    onEdit: (record: any) => void;
    onViewHistory: (record: any) => void;
}> = ({ record, onEdit, onViewHistory }) => {
    const statusInfo = getStatusInfo(record.status);

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden border bg-gray-50">
                        <img
                            src={record.user?.avatarUrl || '/placeholder.png'}
                            alt={`${record.user?.firstName || ''} ${record.user?.lastName || ''}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/placeholder.png';
                            }}
                        />
                    </div>
                    <div>
                        <div className="font-medium">
                            {`${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim() || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {record.user?.email || 'No email'}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-sm">
                {record.user?.phone || 'No phone'}
            </TableCell>
            <TableCell>
                <div className="text-sm font-medium">
                    {record.shift?.shiftPattern?.name || 'Unknown Shift'}
                </div>
                <div className="text-xs text-muted-foreground">
                    {record.shift?.shiftPattern
                        ? `${record.shift.shiftPattern.timings[0].startTime}-${record.shift.shiftPattern.timings[0].endTime}`
                        : ''}
                </div>
            </TableCell>
            <TableCell>
                <div className="text-sm">
                    {format(new Date(record.date), 'dd MMM yyyy')}
                </div>
            </TableCell>
            <TableCell>
                <div className="text-sm font-medium">
                    {record.signInTime ? format(new Date(record.signInTime), 'HH:mm') : '—'}
                </div>
            </TableCell>
            <TableCell>
                <div className="text-sm font-medium">
                    {record.signOutTime ? format(new Date(record.signOutTime), 'HH:mm') : '—'}
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={`${statusInfo.className} px-2 py-1`}>
                    {statusInfo.label}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex space-x-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(record)}
                        className="h-8 w-8 text-gray-600 hover:text-primary hover:bg-primary-50"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewHistory(record)}
                        className="h-8 w-8 text-gray-600 hover:text-primary hover:bg-primary-50"
                    >
                        <History className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

// Mobile Card Component
const AttendanceMobileCard = ({ record, onEdit, onViewHistory }: {
    record: any;
    onEdit: (record: any) => void;
    onViewHistory: (record: any) => void;
}) => {
    const statusInfo = getStatusInfo(record.status);

    return (
        <Card className="overflow-hidden border">
            <CardContent className="p-0">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden border bg-gray-50">
                                <img
                                    src={record.user?.avatarUrl || '/placeholder.png'}
                                    alt={`${record.user?.firstName || ''} ${record.user?.lastName || ''}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/placeholder.png';
                                    }}
                                />
                            </div>
                            <div>
                                <div className="font-medium">
                                    {`${record.user?.firstName || ''} ${record.user?.lastName || ''}`.trim() || 'Unknown User'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {record.user?.email || 'No email'}
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className={`${statusInfo.className} px-2 py-1`}>
                            {statusInfo.label}
                        </Badge>
                    </div>
                </div>

                <Separator />

                <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Phone</span>
                            <span className="text-sm font-medium">{record.user?.phone || 'No phone'}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Date</span>
                            <span className="text-sm font-medium">{format(new Date(record.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Clock In</span>
                            <span className="text-sm font-medium">
                                {record.signInTime ? format(new Date(record.signInTime), 'HH:mm') : '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block mb-1">Clock Out</span>
                            <span className="text-sm font-medium">
                                {record.signOutTime ? format(new Date(record.signOutTime), 'HH:mm') : '—'}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-muted-foreground block mb-1">Shift</span>
                            <span className="text-sm font-medium">
                                {record.shift?.shiftPattern
                                    ? `${record.shift.shiftPattern.name} (${record.shift.shiftPattern.timings[0].startTime}-${record.shift.shiftPattern.timings[0].endTime})`
                                    : 'Unknown Shift'}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="p-3 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(record)}
                        className="h-8"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewHistory(record)}
                        className="h-8"
                    >
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        History
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Filters Component
const FilterControls = ({ queryParams, setQueryParams, agencies, handleReset, isFilterOpen, setIsFilterOpen }) => {
    return (
        <div className={`lg:flex ${isFilterOpen ? 'block' : 'hidden lg:block'} transition-all duration-200`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">From</span>
                    </div>
                    <Input
                        type="date"
                        className="pl-16"
                        value={queryParams.startDate.split('T')[0]}
                        onChange={(e) => {
                            const date = new Date(e.target.value);
                            date.setHours(0, 0, 0, 0);
                            setQueryParams((prev: any) => ({
                                ...prev,
                                page: 1,
                                startDate: date.toISOString()
                            }));
                        }}
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">To</span>
                    </div>
                    <Input
                        type="date"
                        className="pl-12"
                        value={queryParams.endDate.split('T')[0]}
                        onChange={(e) => {
                            const date = new Date(e.target.value);
                            date.setHours(23, 59, 59, 999);
                            setQueryParams((prev: any) => ({
                                ...prev,
                                page: 1,
                                endDate: date.toISOString()
                            }));
                        }}
                    />
                </div>
                <Select
                    value={queryParams.staffType}
                    onValueChange={(value) =>
                        setQueryParams((prev: { agencyId: any; }) => ({
                            ...prev,
                            page: 1,
                            staffType: value,
                            // Fixed the issue: using empty string for "all agencies"
                            agencyId: value === 'agency' ? (prev.agencyId || 'all') : ''
                        }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Staff Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                </Select>

                {queryParams.staffType === 'agency' && (
                    <Select
                        value={queryParams.agencyId}
                        onValueChange={(value) =>
                            setQueryParams((prev: any) => ({
                                ...prev,
                                page: 1,
                                agencyId: value
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Agency" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Fixed the issue: using non-empty string for "all agencies" */}
                            <SelectItem value="all">All Agencies</SelectItem>
                            {agencies?.map((agency: { _id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
                                <SelectItem key={agency._id} value={agency._id}>
                                    {agency.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            {/* <div className="flex gap-2 mt-3 lg:mt-0 lg:ml-3">
                <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 lg:flex-none"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setIsFilterOpen(false)}
                    className="lg:hidden"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div> */}
        </div>
    );
};

const AttendanceRegistry = () => {
    const initialLimit = useMemo(() => calculatePaginationLimit(), []);
    const userState = useSelector(selectUser);
    const currentOrganization = useSelector(selectCurrentOrganization);

    // State
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: initialLimit,
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
        endDate: new Date().toISOString().split('T')[0] + 'T23:59:59.999Z',
        staffType: 'all',
        agencyId: '',
    });

    const [modifyModalOpen, setModifyModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Queries
    const {
        data: attendanceData,
        isLoading,
        refetch
    } = useGetAttendanceRegistryQuery({
        ...queryParams,
        page: queryParams.page,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate
    });

    const { data: agencies } = useGetLinkedAgenciesQuery(currentOrganization?._id);

    // Set correct initial filter values on component moyunt
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        setQueryParams(prev => ({
            ...prev,
            startDate: today.toISOString(),
            endDate: endOfDay.toISOString(),
        }));
    }, []);

    // Handlers
    const handleEdit = (record: React.SetStateAction<null>) => {
        setSelectedAttendance(record);
        setModifyModalOpen(true);
    };

    const handleViewHistory = (record: React.SetStateAction<null>) => {
        setSelectedAttendance(record);
        setHistoryModalOpen(true);
    };

    const handleReset = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        setQueryParams({
            page: 1,
            limit: initialLimit,
            startDate: today.toISOString(),
            endDate: endOfDay.toISOString(),
            staffType: 'all',
            agencyId: '',
        });
    };

    const handlePageChange = (newPage: number) => {
        setQueryParams(prev => ({ ...prev, page: newPage }));
    };

    // Calculate pagination display
    const paginationInfo = useMemo(() => {
        if (!attendanceData) return { start: 0, end: 0, total: 0, totalPages: 0 };

        const start = ((queryParams.page - 1) * queryParams.limit) + 1;
        const end = Math.min(queryParams.page * queryParams.limit, attendanceData.pagination.total);

        return {
            start,
            end,
            total: attendanceData.pagination.total,
            totalPages: attendanceData.pagination.totalPages
        };
    }, [attendanceData, queryParams.page, queryParams.limit]);

    // Render pagination UI
    const renderPagination = () => {
        if (!attendanceData || attendanceData.pagination.totalPages <= 1) return null;

        // For desktop - show page numbers
        return (
            <div className="border-t p-4 bg-gray-50 rounded-b-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                    <p className="text-sm text-muted-foreground mb-3 sm:mb-0">
                        Showing <span className="font-medium">{paginationInfo.start}</span> to <span className="font-medium">{paginationInfo.end}</span> of <span className="font-medium">{paginationInfo.total}</span> results
                    </p>

                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(queryParams.page - 1)}
                                    className={queryParams.page === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                    disabled={queryParams.page === 1}
                                />
                            </PaginationItem>

                            {/* Show limited page numbers for better UI */}
                            {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    // Show first page, last page, current page, and pages around current
                                    return page === 1 ||
                                        page === paginationInfo.totalPages ||
                                        Math.abs(page - queryParams.page) <= 1;
                                })
                                .map((page, idx, arr) => {
                                    // Add ellipsis if there's a gap
                                    const prevPage = arr[idx - 1];
                                    const showEllipsis = prevPage && page - prevPage > 1;

                                    return (
                                        <React.Fragment key={page}>
                                            {showEllipsis && (
                                                <PaginationItem>
                                                    <span className="px-3 py-2">...</span>
                                                </PaginationItem>
                                            )}
                                            <PaginationItem>
                                                <PaginationLink
                                                    className="cursor-pointer"
                                                    onClick={() => handlePageChange(page)}
                                                    isActive={queryParams.page === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </React.Fragment>
                                    );
                                })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(queryParams.page + 1)}
                                    className={queryParams.page === paginationInfo.totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                    disabled={queryParams.page === paginationInfo.totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        );
    };

    // Render mobile pagination UI
    const renderMobilePagination = () => {
        if (!attendanceData || attendanceData.pagination.totalPages <= 1) return null;

        return (
            <Card className="p-3 mt-4">
                <div className="flex justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(queryParams.page - 1)}
                        disabled={queryParams.page === 1}
                        className="h-8 px-2"
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-medium">
                        Page {queryParams.page} of {paginationInfo.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(queryParams.page + 1)}
                        disabled={queryParams.page === paginationInfo.totalPages}
                        className="h-8 px-2"
                    >
                        Next
                    </Button>
                </div>
            </Card>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header Section */}
            <div className="bg-background border-b sticky top-0 z-20">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-semibold">Attendance Registry</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="lg:hidden flex items-center"
                            >
                                <Filter className="h-4 w-4 mr-1.5" />
                                Filters
                                {isFilterOpen ? (
                                    <ChevronUp className="h-4 w-4 ml-1.5" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 ml-1.5" />
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refetch}
                                className="flex items-center"
                            >
                                <RefreshCw className="h-4 w-4 mr-1.5" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <FilterControls
                        queryParams={queryParams}
                        setQueryParams={setQueryParams}
                        agencies={agencies?.data}
                        handleReset={handleReset}
                        isFilterOpen={isFilterOpen}
                        setIsFilterOpen={setIsFilterOpen}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="space-y-4 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                            <p className="text-sm text-muted-foreground">Loading attendance records...</p>
                        </div>
                    </div>
                ) : !attendanceData || attendanceData.records?.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="rounded-full bg-gray-100 p-4 mb-4">
                                <Calendar className="h-8 w-8 text-gray-500" />
                            </div>
                            <p className="text-lg font-medium text-foreground">No attendance records found</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Try adjusting your search criteria or selecting a different date range
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={handleReset}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset Filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="font-medium">Staff Member</TableHead>
                                                <TableHead className="font-medium">Phone</TableHead>
                                                <TableHead className="font-medium">Shift</TableHead>
                                                <TableHead className="font-medium">Date</TableHead>
                                                <TableHead className="font-medium">Clock In</TableHead>
                                                <TableHead className="font-medium">Clock Out</TableHead>
                                                <TableHead className="font-medium">Status</TableHead>
                                                <TableHead className="font-medium">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {attendanceData.records.map((record: unknown) => (
                                                <AttendanceTableRow
                                                    key={record._id}
                                                    record={record}
                                                    onEdit={handleEdit}
                                                    onViewHistory={handleViewHistory}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {renderPagination()}
                            </Card>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-4">
                            {attendanceData.records.map((record: unknown) => (
                                <AttendanceMobileCard
                                    key={record._id}
                                    record={record}
                                    onEdit={handleEdit}
                                    onViewHistory={handleViewHistory}
                                />
                            ))}
                            {renderMobilePagination()}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {selectedAttendance && (
                <>
                    {/* <AttendanceModifyDialog
                        open={modifyModalOpen}
                        onClose={() => {
                            setModifyModalOpen(false);
                            setSelectedAttendance(null);
                        }}
                        attendance={selectedAttendance}
                        onUpdate={refetch}
                    />
                    <ModificationHistory
                        open={historyModalOpen}
                        onClose={() => {
                            setHistoryModalOpen(false);
                            setSelectedAttendance(null);
                        }}
                        attendance={selectedAttendance}
                    /> */}
                </>
            )}
        </div>
    );
};

export default AttendanceRegistry;