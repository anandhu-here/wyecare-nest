import React, { useState, useMemo } from 'react';
import { Mail, RotateCcw, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useGetLinkedOrganizationsPaginatedQuery, useUnlinkOrganizationsMutation } from './organizationApi';
import { IOrganization } from '@wyecare-monorepo/shared-types';
import { LoadingOverlay } from '@/components/loading-overlay';
import InviteOrganizationDialog from './components/invite-organizations';
import DeleteConfirmationDialog from './components/delete-confirmation';
import { selectCurrentOrganization } from '../auth/AuthSlice';



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

const OrganizationList = () => {
    const initialLimit = useMemo(() => calculatePaginationLimit(), []);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedOrganization, setSelectedOrganization] =
        useState<IOrganization | null>(null);

    // Get current organization from Redux state
    const currentOrganization = useSelector(selectCurrentOrganization)

    // State for query parameters
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: initialLimit,
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc' as 'asc' | 'desc',
        type: undefined as string | undefined,
    });

    const {
        data: orgResponse,
        isLoading,
        error,
        refetch,
    } = useGetLinkedOrganizationsPaginatedQuery(queryParams, {
        refetchOnMountOrArgChange: true,
    });

    const [unlinkOrganizations, { isLoading: unlinkLoading }] =
        useUnlinkOrganizationsMutation();

    const organizations = orgResponse?.data || [];
    const pagination = orgResponse?.pagination || {
        total: 0,
        page: 1,
        limit: initialLimit,
        totalPages: 1,
    };

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQueryParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handleSort = (value: string) => {
        setQueryParams((prev) => ({
            ...prev,
            sortOrder: value as 'asc' | 'desc',
            page: 1,
        }));
    };

    const handlePageChange = (newPage: number) => {
        setQueryParams((prev) => ({ ...prev, page: newPage }));
    };

    // Get visible pages for pagination
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const { totalPages, page } = pagination;

        for (
            let i = Math.max(2, page - delta);
            i <= Math.min(totalPages - 1, page + delta);
            i++
        ) {
            range.push(i);
        }

        if (page - delta > 2) range.unshift('...');
        if (page + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    const handleRemoveOrganization = async () => {
        if (!selectedOrganization || !currentOrganization) return;

        try {
            await unlinkOrganizations({
                organizationId1: currentOrganization._id,
                organizationId2: selectedOrganization._id,
            }).unwrap();

            refetch();
            toast.success('Organization removed successfully');
            setIsDeleteModalOpen(false);
        } catch (error) {
            toast.error('Error removing organization');
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 border-b">
                <div className="flex flex-row sm:flex-row">
                    <div className="relative ">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search organizations..."
                            value={queryParams.search}
                            onChange={handleSearch}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex justify-between flex-row gap-1 items-center">
                    <Select value={queryParams.sortOrder} onValueChange={handleSort}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="desc">Newest First</SelectItem>
                            <SelectItem value="asc">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="whitespace-nowrap"
                    >
                        <Mail className="h-4 w-4" />
                        Invite
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
                {/* Desktop View */}
                <Card className="hidden md:flex flex-col flex-1 bg-gray-50 border-gray-200 rounded-lg shadow-lg p-3">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {organizations.map((org: IOrganization) => (
                                    <TableRow key={org._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {org.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{org.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {org.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {org.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>{org.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {org.address
                                                    ? `${org.address.city}, ${org.address.country}`
                                                    : 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${org.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {org.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSelectedOrganization(org);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                    >
                                                        Remove Organization
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t p-4">
                        <div className="flex items-center justify-between">
                            {pagination.total > 0 ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                                        of {pagination.total} results
                                    </p>

                                    <Pagination>
                                        <PaginationContent className="ml-auto">
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => handlePageChange(pagination.page - 1)}
                                                    className={pagination.page > 1 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                                                    disabled={pagination.page === 1 || pagination.totalPages === 0}
                                                />
                                            </PaginationItem>

                                            {pagination.totalPages > 0 ? (
                                                getVisiblePages().map((pageNum, idx) => (
                                                    <PaginationItem key={idx}>
                                                        {pageNum === '...' ? (
                                                            <PaginationEllipsis />
                                                        ) : (
                                                            <PaginationLink
                                                                className="cursor-pointer"
                                                                isActive={pageNum === pagination.page}
                                                                onClick={() => handlePageChange(pageNum as number)}
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        )}
                                                    </PaginationItem>
                                                ))
                                            ) : (
                                                <PaginationItem>
                                                    <PaginationLink isActive={true}>1</PaginationLink>
                                                </PaginationItem>
                                            )}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => handlePageChange(pagination.page + 1)}
                                                    className={pagination.page < pagination.totalPages ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
                                                    disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No results found</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {organizations.map((org) => (
                        <Card key={org._id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                            {org.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{org.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {org.email}
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => {
                                                    setSelectedOrganization(org);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                Remove Organization
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">
                                            Type
                                        </span>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {org.type}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">
                                            Status
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${org.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {org.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">
                                            Contact
                                        </span>
                                        <span className="text-sm">{org.phone || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-muted-foreground block mb-1">
                                            Address
                                        </span>
                                        <span className="text-sm">
                                            {org.address
                                                ? `${org.address.city}, ${org.address.country}`
                                                : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Mobile Pagination */}
                    <div className="md:hidden border-t bg-background p-2">
                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                            {pagination.total > 0 ? (
                                <Pagination className="flex justify-center w-full">
                                    <PaginationContent className="flex flex-wrap justify-center gap-1">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                className={`${pagination.page > 1
                                                    ? 'cursor-pointer hover:bg-primary-500'
                                                    : 'opacity-50 pointer-events-none'
                                                    }`}
                                                onClick={() =>
                                                    pagination.page > 1 &&
                                                    handlePageChange(pagination.page - 1)
                                                }
                                                disabled={pagination.page === 1 || pagination.totalPages === 0}
                                            />
                                        </PaginationItem>

                                        {pagination.totalPages > 0 ? (
                                            (() => {
                                                const totalPages = pagination.totalPages || 1;
                                                let pagesToShow = [];

                                                if (totalPages <= 5) {
                                                    // Show all pages if 5 or fewer
                                                    pagesToShow = Array.from(
                                                        { length: totalPages },
                                                        (_, i) => i + 1
                                                    );
                                                } else {
                                                    // Show a subset of pages with current page in middle when possible
                                                    if (pagination.page <= 3) {
                                                        // Near start
                                                        pagesToShow = [1, 2, 3, 4, '...', totalPages];
                                                    } else if (pagination.page >= totalPages - 2) {
                                                        // Near end
                                                        pagesToShow = [
                                                            1,
                                                            '...',
                                                            totalPages - 3,
                                                            totalPages - 2,
                                                            totalPages - 1,
                                                            totalPages,
                                                        ];
                                                    } else {
                                                        // Middle
                                                        pagesToShow = [
                                                            1,
                                                            '...',
                                                            pagination.page - 1,
                                                            pagination.page,
                                                            pagination.page + 1,
                                                            '...',
                                                            totalPages,
                                                        ];
                                                    }
                                                }

                                                return pagesToShow.map((page, index) => {
                                                    if (page === '...') {
                                                        return (
                                                            <PaginationItem key={`ellipsis-${index}`}>
                                                                <span className="px-2 py-1 text-sm text-gray-400">
                                                                    ...
                                                                </span>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return (
                                                        <PaginationItem key={page}>
                                                            <PaginationLink
                                                                className="cursor-pointer hover:bg-primary-500 h-8 w-8 p-0 flex items-center justify-center text-sm"
                                                                onClick={() => handlePageChange(page)}
                                                                isActive={pagination.page === page}
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                });
                                            })()
                                        ) : (
                                            <PaginationItem>
                                                <PaginationLink isActive={true}>1</PaginationLink>
                                            </PaginationItem>
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                className={`${pagination.page < pagination.totalPages
                                                    ? 'cursor-pointer hover:bg-primary-500'
                                                    : 'opacity-50 pointer-events-none'
                                                    }`}
                                                onClick={() =>
                                                    pagination.page < pagination.totalPages &&
                                                    handlePageChange(pagination.page + 1)
                                                }
                                                disabled={pagination.page === pagination.totalPages || pagination.totalPages === 0}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground w-full">No results found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <LoadingOverlay isVisible={isRefreshing} />
            <InviteOrganizationDialog
                open={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />


            <DeleteConfirmationDialog
                open={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleRemoveOrganization}
                isLoading={unlinkLoading}
                itemName={selectedOrganization?.name}
            />
        </div>
    );
};

export default OrganizationList;