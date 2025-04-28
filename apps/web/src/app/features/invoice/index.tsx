import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, MoreHorizontal, X, AlertCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { useGetInvoicesQuery, useUpdateInvoiceStatusMutation, useLazyGetInvoiceByIdQuery, useDeleteinvoiceMutation } from './invoiceApi';

import { useDispatch, useSelector } from 'react-redux';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// import InvoiceView from '@/components/core/dialogs/shifts/view-invoice';
import { LoadingOverlay } from '@/components/loading-overlay';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { selectCurrentOrganization } from '../auth/AuthSlice';
import { Invoice } from '@wyecare-monorepo/shared-types';
import { toast } from 'react-toastify';


// Status Badge Component
type InvoiceStatus = 'draft' | 'pending' | 'accepted' | 'paid' | 'rejected' | 'cancelled' | 'invalidated';

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
    const statusConfig: Record<InvoiceStatus, string> = {
        draft: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow 100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        paid: 'bg-blue-100 text-blue-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-red-100 text-red-800',
        invalidated: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig.draft}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// Desktop Table Row Component
const InvoiceTableRow = ({ invoice, onViewInvoice, onStatusUpdate, onDeleteInvoice, organizationType }: {
    invoice: any;
    onViewInvoice: (invoice: any) => void;
    onStatusUpdate: (invoice: any, status: InvoiceStatus) => void;
    onDeleteInvoice: (invoice: any) => void;
    organizationType: string;
}) => {
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{invoice.invoiceNumber}</div>
            </TableCell>
            <TableCell>
                {organizationType === 'home' ? invoice.agencyId.name : invoice.homeId.name}
            </TableCell>
            <TableCell>
                <div className="font-medium">£{invoice.totalAmount.toFixed(2)}</div>
            </TableCell>
            <TableCell>
                <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>{format(new Date(invoice.createdAt), 'dd MMM yyyy')}</TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                        <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
                            View Details
                        </DropdownMenuItem>

                        {((organizationType === 'home' && invoice.status === 'pending') || (organizationType === 'agency' && invoice.isTemporaryHome)) && (
                            <>
                                <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => onStatusUpdate(invoice, 'accepted')}
                                >
                                    Accept Invoice
                                </DropdownMenuItem>
                                {
                                    !(organizationType === 'agency' && invoice.isTemporaryHome) && <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onStatusUpdate(invoice, 'rejected')}
                                    >
                                        Reject Invoice
                                    </DropdownMenuItem>
                                }
                            </>
                        )}

                        {organizationType === 'agency' && invoice.status === 'accepted' && (
                            <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => onStatusUpdate(invoice, 'paid')}
                            >
                                Mark as Paid
                            </DropdownMenuItem>
                        )}
                        {/* invalidating an invoice */}

                        {organizationType === 'agency' && (invoice.status === 'accepted' || invoice.status === 'invoiced' || invoice.status === 'paid') && (
                            <DropdownMenuItem

                                className="text-red-600"
                                onClick={() => onStatusUpdate(invoice, 'invalidated')}
                            >
                                Invalidate Invoice
                            </DropdownMenuItem>
                        )}

                        {organizationType === 'agency' &&
                            (invoice.status === 'cancelled' || invoice.status === 'invalidated' || invoice.status === 'pending') && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onDeleteInvoice(invoice)}
                                >
                                    Delete Invoice
                                </DropdownMenuItem>
                            )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

// Mobile Card Component
const InvoiceMobileCard = ({ invoice, onViewInvoice, onStatusUpdate, onDeleteInvoice, organizationType }: {
    invoice: any;
    onViewInvoice: (invoice: any) => void;
    onStatusUpdate: (invoice: any, status: InvoiceStatus) => void;
    onDeleteInvoice: (invoice: any) => void;
    organizationType: string;
}) => {
    return (
        <Card className="mb-1">
            <Accordion type="single" collapsible className="w-full ">
                <AccordionItem value={invoice._id} className="border-0 ">
                    {/* Card Header - Always Visible */}
                    <div className="flex items-center justify-between p-4 ">
                        <div className="flex items-center gap-2">
                            <AccordionTrigger className="p-0 hover:no-underline">
                            </AccordionTrigger>
                            <div>
                                <div className="font-medium">{invoice.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                    {organizationType === 'home' ? invoice.agencyId.name : invoice.homeId.name}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={invoice.status} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white">
                                    <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
                                        View Details
                                    </DropdownMenuItem>

                                    {organizationType === 'home' && invoice.status === 'pending' && (
                                        <>
                                            <DropdownMenuItem
                                                className="text-green-600"
                                                onClick={() => onStatusUpdate(invoice, 'accepted')}
                                            >
                                                Accept Invoice
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => onStatusUpdate(invoice, 'rejected')}
                                            >
                                                Reject Invoice
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    {organizationType === 'agency' && invoice.status === 'accepted' && (
                                        <DropdownMenuItem
                                            className="text-blue-600"
                                            onClick={() => onStatusUpdate(invoice, 'paid')}
                                        >
                                            Mark as Paid
                                        </DropdownMenuItem>
                                    )}

                                    {organizationType === 'agency' &&
                                        (invoice.status === 'cancelled' || invoice.status === 'invalidated') && (
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => onDeleteInvoice(invoice)}
                                            >
                                                Delete Invoice
                                            </DropdownMenuItem>
                                        )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Collapsible Content */}
                    <AccordionContent>
                        <CardContent className="pt-0 pb-4 px-4">
                            <Separator className="mb-4" />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">Amount</span>
                                    <span className="font-medium">£{invoice.totalAmount.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">Created</span>
                                    <span>{format(new Date(invoice.createdAt), 'dd MMM yyyy')}</span>
                                </div>

                                {invoice.dueDate && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">Due Date</span>
                                        <span>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</span>
                                    </div>
                                )}

                                {invoice.paidDate && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">Paid On</span>
                                        <span>{format(new Date(invoice.paidDate), 'dd MMM yyyy')}</span>
                                    </div>
                                )}

                                {invoice.submittedDate && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">Submitted</span>
                                        <span>{format(new Date(invoice.submittedDate), 'dd MMM yyyy')}</span>
                                    </div>
                                )}

                                {invoice.updatedAt && (
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">Last Updated</span>
                                        <span>{format(new Date(invoice.updatedAt), 'dd MMM yyyy')}</span>
                                    </div>
                                )}
                            </div>
                            {invoice.notes && (
                                <div className="mt-3">
                                    <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                                    <p className="text-sm">{invoice.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

const calculatePaginationLimit = () => {
    const screenHeight = window.innerHeight;
    const availableHeight = screenHeight - 300;
    const possibleRows = Math.floor(availableHeight / 73);

    if (screenHeight < 768) return 7;
    if (screenHeight < 900) return 9;
    if (screenHeight < 1080) return 10;
    return 12;
};

// Main Invoice Table Component
const OrgInvoices = () => {
    const initialLimit = useMemo(() => calculatePaginationLimit(), []);

    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: initialLimit,
        status: 'all',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const dispatch = useDispatch();
    const organization = useSelector(selectCurrentOrganization);

    // Queries
    const {
        data: invoicesResponse,
        isLoading,
        error: invoicesError,
        refetch
    } = useGetInvoicesQuery({
        ...queryParams,
        status: queryParams.status !== 'all' ? queryParams.status : undefined,
        search: queryParams.search || undefined
    });

    const [updateStatus] = useUpdateInvoiceStatusMutation();
    const [getInvoiceById] = useLazyGetInvoiceByIdQuery();
    const [deleteInvoice] = useDeleteinvoiceMutation();

    // Event Handlers
    const handleSearch = (e) => {
        setQueryParams(prev => ({
            ...prev,
            search: e.target.value,
            page: 1
        }));
    };

    const handleStatusFilter = (value: any) => {
        setQueryParams(prev => ({
            ...prev,
            status: value,
            page: 1
        }));
    };

    const handlePageChange = (newPage: any) => {
        setQueryParams(prev => ({ ...prev, page: newPage }));
    };

    const handleViewInvoice = async (invoice: Invoice) => {
        try {
            const response: any = await getInvoiceById(invoice._id as string).unwrap();
            setSelectedInvoice(response.data);
            setViewInvoiceOpen(true);
        } catch (error) {
            toast.error('Error fetching invoice details');
        }
    };

    const handleStatusUpdate = async (invoice: Invoice, status: any) => {
        try {
            await updateStatus({
                invoiceId: invoice._id as string,
                status
            }).unwrap();
            toast.success(`Invoice status updated to ${status}`);
            refetch();
        } catch (error) {
            toast.error('Error updating invoice status');
        }
    };

    const handleDeleteInvoice = async (invoice: Invoice) => {
        try {
            await deleteInvoice(invoice._id as string).unwrap();
            toast.success('Invoice deleted successfully');
            refetch();
        } catch (error) {
            toast.error('Error deleting invoice');
        }
    };

    return (
        <div className="flex flex-col h-full md:h-[calc(100vh-4rem)]">
            <LoadingOverlay isVisible={isRefreshing} />
            {/* Header Section */}
            <div className="bg-background border-b py-4 px-2 sm:px-6">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-medium text-foreground hidden sm:block">Invoices</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search invoices..."
                                value={queryParams.search}
                                onChange={handleSearch}
                                className="pl-10 w-full sm:w-[250px] md:w-[300px]"
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            <Select value={queryParams.status} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Invoices</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={async () => {
                                    setIsRefreshing(true);
                                    await refetch();

                                    setTimeout(() => {
                                        setIsRefreshing(false);
                                    }
                                        , 500);
                                }}
                                title="Refresh"
                                className="flex-shrink-0 h-10 w-10"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="space-y-4">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                            <p className="text-sm text-muted-foreground">Loading invoices...</p>
                        </div>
                    </div>
                ) : invoicesError ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-lg font-medium text-destructive">Error loading invoices</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Please try refreshing the page
                            </p>
                        </CardContent>
                    </Card>
                ) : invoicesResponse?.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <p className="text-lg font-medium text-foreground">No invoices found</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Try adjusting your search criteria
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Desktop View */}
                        <Card className="hidden md:flex flex-col flex-1 p-2">
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>Invoice Number</TableHead>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoicesResponse?.data?.map((invoice: Invoice) => (
                                            <InvoiceTableRow
                                                key={invoice._id as string}
                                                invoice={invoice}
                                                onViewInvoice={handleViewInvoice}
                                                onStatusUpdate={handleStatusUpdate}
                                                onDeleteInvoice={handleDeleteInvoice}
                                                organizationType={organization?.type as string}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Desktop Pagination */}
                            {/* Desktop Pagination - Improved for scalability */}
                            <div className="border-t p-4 bg-gray-100 rounded-b-xl">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((queryParams.page - 1) * queryParams.limit) + 1} to{' '}
                                        {Math.min(queryParams.page * queryParams.limit, invoicesResponse?.pagination.total)} of{' '}
                                        {invoicesResponse?.pagination.total} results
                                    </p>

                                    <Pagination>
                                        <PaginationContent className='ml-auto'>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => queryParams.page > 1 && handlePageChange(queryParams.page - 1)}
                                                    className={`${queryParams.page > 1 ? 'cursor-pointer hover:bg-primary' : 'cursor-not-allowed opacity-50'}`}
                                                    disabled={queryParams.page === 1}
                                                />
                                            </PaginationItem>

                                            {(() => {
                                                const totalPages = invoicesResponse?.pagination.totalPages;
                                                let pagesToShow = [];

                                                if (totalPages <= 7) {
                                                    // Show all pages if 7 or fewer
                                                    pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                                } else {
                                                    // Show a subset of pages with current page in middle when possible
                                                    if (queryParams.page <= 4) {
                                                        // Near start
                                                        pagesToShow = [1, 2, 3, 4, 5, '...', totalPages];
                                                    } else if (queryParams.page >= totalPages - 3) {
                                                        // Near end
                                                        pagesToShow = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                                    } else {
                                                        // Middle
                                                        pagesToShow = [1, '...', queryParams.page - 1, queryParams.page, queryParams.page + 1, '...', totalPages];
                                                    }
                                                }

                                                return pagesToShow.map((page, index) => {
                                                    if (page === '...') {
                                                        return (
                                                            <PaginationItem key={`ellipsis-${index}`}>
                                                                <div className="flex h-9 w-9 items-center justify-center">
                                                                    <PaginationEllipsis />
                                                                </div>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                className="cursor-pointer hover:bg-primary"
                                                                onClick={() => handlePageChange(page)}
                                                                isActive={queryParams.page === page}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                });
                                            })()}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => queryParams.page < invoicesResponse?.pagination.totalPages && handlePageChange(queryParams.page + 1)}
                                                    className={`${queryParams.page < invoicesResponse?.pagination.totalPages ? 'cursor-pointer hover:bg-primary' : 'cursor-not-allowed opacity-50'}`}
                                                    disabled={queryParams.page === invoicesResponse?.pagination.totalPages}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </div>
                        </Card>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-2">
                            {invoicesResponse?.data.map((invoice) => (
                                <InvoiceMobileCard
                                    key={invoice._id}
                                    invoice={invoice}
                                    onViewInvoice={handleViewInvoice}
                                    onStatusUpdate={handleStatusUpdate}
                                    onDeleteInvoice={handleDeleteInvoice}
                                    organizationType={organizationType}
                                />
                            ))}

                            {/* Mobile Pagination */}
                            <Card className="p-4">
                                <div className="flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePageChange(queryParams.page - 1)}
                                        disabled={queryParams.page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {queryParams.page} of {invoicesResponse?.pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePageChange(queryParams.page + 1)}
                                        disabled={queryParams.page === invoicesResponse?.pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>

            {/* {
                viewInvoiceOpen && (
                    <InvoiceView
                        open={viewInvoiceOpen}
                        onClose={() => setViewInvoiceOpen(false)}
                        invoice={selectedInvoice}
                    />
                )
            } */}
        </div>
    );
};

export default OrgInvoices;