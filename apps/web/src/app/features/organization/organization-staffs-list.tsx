import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, MoreHorizontal, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    useGetStaffPaginatedQuery,
    useRemoveUserFromOrganizationMutation
} from './organizationApi';
import { selectCurrentOrganization } from './OrganizationSlice';
import DeleteConfirmationDialog from './components/delete-confirmation';

// Types
interface QueryParams {
    page: number;
    limit: number;
    role: string;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    status?: string;
    startDate?: string;
    endDate?: string;
}

interface User {
    _id: string;
    avatarUrl: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface Staff {
    _id: string;
    user: User;
    role: string;
    staffType: 'care' | 'admin';
    organization: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface APIResponse {
    data: Staff[];
    pagination: PaginationData;
}

// Role configurations
const rolesByType = {
    care: [
        { value: 'carer', label: 'Carer' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'senior_carer', label: 'Senior Carer' }
    ],
    admin: [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'hr', label: 'HR' },
        { value: 'finance', label: 'Finance' }
    ]
};

// Calculate pagination limit based on screen size
const calculatePaginationLimit = () => {
    const screenHeight = window.innerHeight;
    // Each row is approximately 73px high
    // We subtract 300px to account for headers, filters, and other UI elements
    const availableHeight = screenHeight - 300;
    const possibleRows = Math.floor(availableHeight / 73);

    if (screenHeight < 768) { // Small screens
        return 7;
    } else if (screenHeight < 900) { // Normal laptop
        return 9;
    } else if (screenHeight < 1080) { // Large screens
        return 10;
    } else { // Very large screens
        return 12;
    }
};

const OrganizationStaffsList: React.FC = () => {
    const initialLimit = useMemo(() => calculatePaginationLimit(), []);
    const navigate = useNavigate();
    const currentOrganization = useSelector(selectCurrentOrganization);

    // Query parameters state
    const [queryParams, setQueryParams] = useState<QueryParams>({
        page: 1,
        limit: initialLimit,
        role: 'all',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    // State for UI controls
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

    // RTK Query hooks
    const {
        data: staffResponse,
        isLoading: isStaffsLoading,
        refetch: refetchStaffs
    } = useGetStaffPaginatedQuery({
        ...queryParams,
        role: queryParams.role !== 'all' ? queryParams.role : undefined,
        search: queryParams.search || undefined
    }, {
        refetchOnMountOrArgChange: true
    });

    const [removeUserFromOrganization, { isLoading: isRemoving }] =
        useRemoveUserFromOrganizationMutation();

    // Derived state
    const staffData = staffResponse?.data || [];
    const paginationData: PaginationData = staffResponse?.pagination || {
        total: 0,
        page: 1,
        limit: queryParams.limit,
        totalPages: 1
    };

    // Use the data directly from the API response
    // The backend is already handling filtering and pagination
    const filteredStaffData = staffData;

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQueryParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setQueryParams(prev => ({ ...prev, page: newPage }));
    };

    const handleRemoveStaff = (staff: Staff) => {
        setSelectedStaff(staff);
        setActivePopover('delete');
    };

    const confirmRemoveStaff = async () => {
        if (!selectedStaff) return;

        try {
            await removeUserFromOrganization(selectedStaff.user._id).unwrap();
            toast.success(`${selectedStaff.user.firstName} ${selectedStaff.user.lastName} was removed successfully`);
            refetchStaffs();
        } catch (error) {
            toast.error('Failed to remove staff');
            console.error('Failed to remove staff:', error);
        }

        setActivePopover(null);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetchStaffs();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const totalPages = paginationData.totalPages;
        const currentPage = paginationData.page;

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            range.unshift('...');
        }
        if (currentPage + delta < totalPages - 1) {
            range.push('...');
        }

        range.unshift(1);
        if (totalPages > 1) {
            range.push(totalPages);
        }

        return range;
    };

    // UI Components
    const LoadingOverlay: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
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
        <div className="flex flex-col">
            {/* Header Section */}
            <div className="flex items-center justify-start p-4 border-b">
                <div className="flex gap-2">
                    <div className="relative flex-1 mx-2">
                        <Input
                            className="pr-8 w-48"
                            placeholder="Search staff..."
                            value={queryParams.search}
                            onChange={handleSearch}
                        />
                        {queryParams.search && (
                            <button
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => setQueryParams(prev => ({ ...prev, search: '' }))}
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterDialogOpen(true)}
                        className="relative"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                        {queryParams.role !== 'all' && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                !
                            </span>
                        )}
                    </Button>

                    <Button
                        size='sm'
                        variant="outline"
                        onClick={() => setIsInviteModalOpen(true)}
                    >
                        Invite Staff
                    </Button>

                    <Button
                        size='sm'
                        variant="default"
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-2">
                {/* Desktop View */}
                <Card className="hidden md:flex flex-col flex-1 border-gray-200 rounded-lg shadow-lg p-3">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStaffData.map((staff: any) => (
                                    <TableRow
                                        key={staff._id}
                                        className='cursor-pointer hover:bg-gray-50'
                                        onClick={() => navigate(`/employee-profile/${staff.user._id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage
                                                        className='object-scale-down'
                                                        src={staff.user.avatarUrl || undefined}
                                                    />
                                                    <AvatarFallback>
                                                        {staff.user.firstName.charAt(0)}{staff.user.lastName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{staff.user.firstName} {staff.user.lastName}</div>
                                                    <div className="text-sm text-gray-500">{staff.user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {staff.role.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell>{staff.user.phone || 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className='bg-white' align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/employee-profile/${staff.user._id}`);
                                                    }}>
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveStaff(staff);
                                                        }}
                                                    >
                                                        Remove Staff
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
                            <p className="text-sm text-muted-foreground">
                                Showing {((paginationData.page - 1) * paginationData.limit) + 1} to{' '}
                                {Math.min(paginationData.page * paginationData.limit, paginationData.total)} of{' '}
                                {paginationData.total} results
                            </p>

                            <Pagination>
                                <PaginationContent className='ml-auto'>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            className={`cursor-pointer hover:bg-primary-500 ${paginationData.page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                                            onClick={() => paginationData.page > 1 && handlePageChange(paginationData.page - 1)}
                                        />
                                    </PaginationItem>

                                    {getVisiblePages().map((pageNum, idx) => (
                                        <PaginationItem key={idx}>
                                            {pageNum === '...' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    className="cursor-pointer hover:bg-primary-500"
                                                    isActive={pageNum === paginationData.page}
                                                    onClick={() => handlePageChange(pageNum as number)}
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            className={`cursor-pointer hover:bg-primary-500 ${paginationData.page >= paginationData.totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                                            onClick={() => paginationData.page < paginationData.totalPages && handlePageChange(paginationData.page + 1)}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </Card>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredStaffData.map((staff: any) => (
                        <Card
                            key={staff._id}
                            className="p-4"
                            onClick={() => navigate(`/employee-profile/${staff.user._id}`)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage
                                            className='object-scale-down'
                                            src={staff.user.avatarUrl || undefined}
                                        />
                                        <AvatarFallback>
                                            {staff.user.firstName.charAt(0)}{staff.user.lastName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {staff.user.firstName} {staff.user.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500">{staff.user.email}</div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/employee-profile/${staff.user._id}`);
                                        }}>
                                            View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveStaff(staff);
                                            }}
                                        >
                                            Remove Staff
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Role</span>
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {staff.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500 block mb-1">Status</span>
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-sm text-gray-500 block mb-1">Contact</span>
                                    <span className="text-sm">{staff.user.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Mobile Pagination */}
                    {paginationData.total > 0 && (
                        <div className="md:hidden border-t bg-background p-4">
                            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
                                <Pagination className="flex justify-center w-full">
                                    <PaginationContent className="flex flex-wrap justify-center gap-1">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                className={`cursor-pointer hover:bg-primary-500 ${paginationData.page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={() => paginationData.page > 1 && handlePageChange(paginationData.page - 1)}
                                            />
                                        </PaginationItem>

                                        {/* Dynamic pagination that shows limited pages based on current page */}
                                        {(() => {
                                            const totalPages = paginationData.totalPages || 1;
                                            let pagesToShow = [];

                                            if (totalPages <= 5) {
                                                // Show all pages if 5 or fewer
                                                pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
                                            } else {
                                                // Show a subset of pages with current page in middle when possible
                                                if (paginationData.page <= 3) {
                                                    // Near start
                                                    pagesToShow = [1, 2, 3, 4, '...', totalPages];
                                                } else if (paginationData.page >= totalPages - 2) {
                                                    // Near end
                                                    pagesToShow = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                                                } else {
                                                    // Middle
                                                    pagesToShow = [1, '...', paginationData.page - 1, paginationData.page, paginationData.page + 1, '...', totalPages];
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
                                                            className="cursor-pointer hover:bg-primary-500 h-8 w-8 p-0 flex items-center justify-center text-sm"
                                                            onClick={() => handlePageChange(page as number)}
                                                            isActive={paginationData.page === page}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            });
                                        })()}

                                        <PaginationItem>
                                            <PaginationNext
                                                className={`cursor-pointer hover:bg-primary-500 ${paginationData.page >= paginationData.totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                                                onClick={() => paginationData.page < paginationData.totalPages && handlePageChange(paginationData.page + 1)}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={activePopover === 'delete'}
                onClose={() => setActivePopover(null)}
                onConfirm={confirmRemoveStaff}
                title="Remove Staff"
                description={`Are you sure you want to remove ${selectedStaff?.user.firstName} ${selectedStaff?.user.lastName} from the organization?`}
                isLoading={isRemoving}
            />

            {/* Loading Overlay */}
            <LoadingOverlay isVisible={isStaffsLoading || isRefreshing} />
        </div>
    );
};

export default OrganizationStaffsList;