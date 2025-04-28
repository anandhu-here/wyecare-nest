// LeaveRequestsTab.tsx
"use client";

import React, { useState } from 'react';
import { useGetLeaveRequestsQuery, useUpdateLeaveStatusMutation } from '../leaveApi';
import { LeaveStatus, LeaveTimeUnit } from '@wyecare-monorepo/shared-types';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { Search, Filter, Check, X, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LeaveRequestsTabProps {
    orgId: string;
    refreshData: () => void;
}

const LeaveRequestsTab: React.FC<LeaveRequestsTabProps> = ({ orgId, refreshData }) => {
    // State for filters and pagination
    const [filters, setFilters] = useState({
        status: 'all',
        leaveType: '',
        startDate: '',
        endDate: '',
        search: '',
    });

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionComment, setActionComment] = useState('');

    // API queries and mutations
    const { data: leaveRequestsResponse, isLoading, isFetching } = useGetLeaveRequestsQuery({
        organizationId: orgId,
        page,
        limit,
        status: filters.status !== 'all' ? filters.status as LeaveStatus : undefined,
        leaveType: filters.leaveType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
    }, {
        refetchOnMountOrArgChange: true,
        skip: !orgId
    });

    const [updateLeaveStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();

    // Request handlers
    const handleViewRequest = (request: any) => {
        setSelectedRequest(request);
        setViewDialogOpen(true);
    };

    const handleActionClick = (request: any, type: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setActionType(type);
        setActionComment('');
        setActionDialogOpen(true);
    };

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;

        try {
            await updateLeaveStatus({
                requestId: selectedRequest._id,
                updateStatusDto: {
                    status: actionType === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
                    comments: actionComment
                }
            }).unwrap();

            toast.success(`Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
            setActionDialogOpen(false);
            refreshData();
        } catch (error) {
            toast.error(`Failed to ${actionType} leave request`);
        }
    };

    // Filter handlers
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPage(1); // Reset page when filters change
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFilterChange('search', e.target.value);
    };

    const resetFilters = () => {
        setFilters({
            status: 'all',
            leaveType: '',
            startDate: '',
            endDate: '',
            search: '',
        });
        setPage(1);
    };

    const leaveRequests = leaveRequestsResponse?.data || [];
    const pagination = leaveRequestsResponse?.pagination;

    // Get leave types for filter dropdown
    // This would come from a query to get leave types
    const leaveTypes = ['Annual Leave', 'Sick Leave', 'Parental Leave', 'Unpaid Leave'];

    // Status badge helper
    const getStatusBadge = (status: LeaveStatus) => {
        const statusConfig: Record<LeaveStatus, { color: string, label: string }> = {
            [LeaveStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', label: 'Pending' },
            [LeaveStatus.APPROVED]: { color: 'bg-green-100 text-green-800 hover:bg-green-200', label: 'Approved' },
            [LeaveStatus.REJECTED]: { color: 'bg-red-100 text-red-800 hover:bg-red-200', label: 'Rejected' },
            [LeaveStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800 hover:bg-gray-200', label: 'Cancelled' },
            [LeaveStatus.INVALIDATED]: { color: 'bg-purple-100 text-purple-800 hover:bg-purple-200', label: 'Invalidated' }
        };

        const config = statusConfig[status];
        return (
            <Badge className={`${config.color}`}>
                {config.label}
            </Badge>
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-10 w-1/3" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="space-y-2">
                            {Array(5).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by employee name or ID..."
                                value={filters.search}
                                onChange={handleSearch}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value={LeaveStatus.PENDING}>Pending</SelectItem>
                                <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
                                <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
                                <SelectItem value={LeaveStatus.CANCELLED}>Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.leaveType} onValueChange={(value) => handleFilterChange('leaveType', value)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Leave Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {leaveTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={resetFilters} className="md:w-auto">
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Request List */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Leave Type</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaveRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <p className="text-muted-foreground">No leave requests found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaveRequests.map((request) => (
                                    <TableRow key={request._id}>
                                        <TableCell>
                                            <div className="font-medium">{request.user.firstName} {request.user.lastName}</div>
                                            <div className="text-sm text-muted-foreground">{request.user.email}</div>
                                        </TableCell>
                                        <TableCell>{request.leaveType}</TableCell>
                                        <TableCell>
                                            <div>{format(new Date(request.startDateTime), 'dd MMM yyyy')}</div>
                                            <div className="text-sm text-muted-foreground">to {format(new Date(request.endDateTime), 'dd MMM yyyy')}</div>
                                        </TableCell>
                                        <TableCell>
                                            {request.amount} {request.timeUnit.toLowerCase()}
                                            {request.isPartialTimeUnit && <span className="text-xs ml-1">(partial)</span>}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>

                                                    {request.status === LeaveStatus.PENDING && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleActionClick(request, 'approve')}>
                                                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                                                <span className="text-green-600">Approve</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleActionClick(request, 'reject')}>
                                                                <X className="mr-2 h-4 w-4 text-red-600" />
                                                                <span className="text-red-600">Reject</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                />
                            </PaginationItem>

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1))
                                .map((pageNum, i, arr) => {
                                    // Add ellipsis
                                    if (i > 0 && pageNum > arr[i - 1] + 1) {
                                        return (
                                            <React.Fragment key={`ellipsis-${pageNum}`}>
                                                <PaginationItem>
                                                    <span className="px-4 py-2">...</span>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        onClick={() => setPage(pageNum)}
                                                        isActive={page === pageNum}
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </React.Fragment>
                                        );
                                    }

                                    return (
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink
                                                onClick={() => setPage(pageNum)}
                                                isActive={page === pageNum}
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                    disabled={page === pagination.totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* View Leave Request Dialog */}
            {selectedRequest && (
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Leave Request Details</DialogTitle>
                            <DialogDescription>
                                {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}'s leave request
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
                                <p className="font-medium">{selectedRequest.leaveType}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <div>{getStatusBadge(selectedRequest.status)}</div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                                <p>{format(new Date(selectedRequest.startDateTime), 'dd MMM yyyy')}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                                <p>{format(new Date(selectedRequest.endDateTime), 'dd MMM yyyy')}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                <p>{selectedRequest.amount} {selectedRequest.timeUnit.toLowerCase()}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Requested On</p>
                                <p>{format(new Date(selectedRequest.createdAt), 'dd MMM yyyy')}</p>
                            </div>

                            <div className="col-span-2 space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Reason</p>
                                <p className="text-sm">{selectedRequest.reason}</p>
                            </div>

                            {selectedRequest.comments && (
                                <div className="col-span-2 space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Comments</p>
                                    <p className="text-sm">{selectedRequest.comments}</p>
                                </div>
                            )}

                            {selectedRequest.approvedBy && (
                                <div className="col-span-2 space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {selectedRequest.status === LeaveStatus.APPROVED ? 'Approved By' : 'Reviewed By'}
                                    </p>
                                    <p className="text-sm">
                                        {selectedRequest.approvedBy.firstName} {selectedRequest.approvedBy.lastName}
                                        {selectedRequest.reviewedAt && (
                                            <span className="text-muted-foreground"> on {format(new Date(selectedRequest.reviewedAt), 'dd MMM yyyy')}</span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>

                            {selectedRequest.status === LeaveStatus.PENDING && (
                                <>
                                    <Button variant="destructive" onClick={() => {
                                        setViewDialogOpen(false);
                                        handleActionClick(selectedRequest, 'reject');
                                    }}>
                                        Reject
                                    </Button>
                                    <Button onClick={() => {
                                        setViewDialogOpen(false);
                                        handleActionClick(selectedRequest, 'approve');
                                    }}>
                                        Approve
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Approve/Reject Dialog */}
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? 'Are you sure you want to approve this leave request?'
                                : 'Please provide a reason for rejecting this leave request.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Leave request for {selectedRequest?.user?.firstName} {selectedRequest?.user?.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                                {selectedRequest?.leaveType} - {selectedRequest?.amount} {selectedRequest?.timeUnit?.toLowerCase()}<br />
                                {/*     {format(new Date(selectedRequest?.startDateTime), 'dd MMM yyyy')} to {format(new Date(selectedRequest?.endDateTime), 'dd MMM yyyy')} */}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="comment" className="text-sm font-medium">
                                {actionType === 'approve' ? 'Comment (optional)' : 'Reason for rejection'}
                            </label>
                            <textarea
                                id="comment"
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={actionType === 'approve' ? 'Add a comment (optional)' : 'Provide reason for rejection'}
                                required={actionType === 'reject'}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={actionType === 'approve' ? 'default' : 'destructive'}
                            onClick={handleAction}
                            disabled={isUpdating || (actionType === 'reject' && !actionComment)}
                        >
                            {isUpdating ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LeaveRequestsTab;