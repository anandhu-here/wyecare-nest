// UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useUsersControllerFindAllQuery,
    User,
    useUsersControllerRemoveMutation,
} from '@/features/generatedApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import {
    UserPlus,
    Search,
    MoreHorizontal,
    ArrowUpDown,
    User as UserIcon,
    UserCog,
    Shield,
    Trash2,
    Building,
    Mail,
    X,
    AlertTriangle,
    Briefcase,
    Check,
} from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/features/auth/authSlice';

// Filters interface
interface Filters {
    firstName: string;
    lastName: string;
    email: string;
    organizationId: string | null;
}

// Sort interface
interface SortOption {
    field: string;
    direction: 'asc' | 'desc';
}

export function UsersPage() {
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const orgId = currentUser?.organizationId

    // State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState<Filters>({
        firstName: '',
        lastName: '',
        email: '',
        organizationId: orgId || null,
    });
    const [sort, setSort] = useState<SortOption>({ field: 'firstName', direction: 'asc' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    const [
        removeUserMutation,
        { isLoading: isRemovingUser, isSuccess: isRemoveSuccess, reset: resetRemoveMutation },
    ] = useUsersControllerRemoveMutation();

    // API query
    const {
        data: usersData,
        isLoading,
        isFetching,
        refetch,
    } = useUsersControllerFindAllQuery({
        skip: (page - 1) * pageSize,
        take: pageSize,
        firstName: debouncedFilters.firstName || undefined,
        lastName: debouncedFilters.lastName || undefined,
        email: debouncedFilters.email || undefined,
        organizationId: debouncedFilters.organizationId || undefined,
    });

    // Debounce filter changes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [filters]);

    // Pagination calculation
    const totalPages = usersData?.total
        ? Math.ceil(usersData.total / pageSize)
        : 0;

    // Handle filter changes
    const handleFilterChange = (
        key: keyof Filters,
        value: string | null
    ) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page when filters change
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            firstName: '',
            lastName: '',
            email: '',
            organizationId: orgId || null,
        });
    };

    // Handle sort
    const handleSort = (field: string) => {
        setSort((prev) => ({
            field,
            direction:
                prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Delete user logic (NOTE: Implement the actual delete API call)
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {

            await removeUserMutation(userToDelete.id).unwrap();

            toast.success('User deleted successfully');
            setDeleteDialogOpen(false);
            refetch();
        } catch (error) {
            toast.error('Failed to delete user');
            console.error('Delete error:', error);
        }
    };

    return (
        <div className="mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Users</h1>
                <Button
                    onClick={() => navigate('/users/invite')}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite User
                </Button>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex justify-between items-center">
                        <span>Filters</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 px-2 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" /> Clear
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by first name"
                                    className="pl-8"
                                    value={filters.firstName}
                                    onChange={(e) => handleFilterChange('firstName', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by last name"
                                    className="pl-8"
                                    value={filters.lastName}
                                    onChange={(e) => handleFilterChange('lastName', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by email"
                                    className="pl-8"
                                    value={filters.email}
                                    onChange={(e) => handleFilterChange('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Organization</label>
                            <Select
                                value={filters.organizationId || ""}
                                onValueChange={(value) => handleFilterChange('organizationId', value || null)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Organizations</SelectItem>
                                    {orgId && (
                                        <SelectItem value={orgId}>
                                        </SelectItem>
                                    )}
                                    {/* Add more organizations here if needed */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableCaption>
                            {isFetching ? 'Loading users...' :
                                usersData?.total === 0 ? 'No users found.' :
                                    `Showing ${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, usersData?.total || 0)} of ${usersData?.total} users`}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">
                                    <div
                                        className="flex items-center cursor-pointer"
                                        onClick={() => handleSort('firstName')}
                                    >
                                        Name
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div
                                        className="flex items-center cursor-pointer"
                                        onClick={() => handleSort('email')}
                                    >
                                        Email
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                // Loading skeleton
                                Array(5).fill(0).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : usersData?.users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No users found. Try clearing some filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usersData?.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                                                    <UserIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    {user.firstName} {user.lastName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.organization ? (
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span>{user.organization.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.slice(0, 2).map((role) => (
                                                    <Badge key={role.id} variant={role.isSystemRole ? "default" : "outline"}>
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                                {user.roles && user.roles.length > 2 && (
                                                    <Badge variant="secondary">+{user.roles.length - 2}</Badge>
                                                )}
                                                {(!user.roles || user.roles.length === 0) && (
                                                    <span className="text-muted-foreground italic">No roles</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <Badge variant="success" className="bg-green-100 text-green-800">
                                                    <Check className="h-3 w-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                                    <X className="h-3 w-3 mr-1" /> Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/users/${user.id}`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <UserIcon className="h-4 w-4 mr-2" />
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/users/${user.id}/edit`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <UserCog className="h-4 w-4 mr-2" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => navigate(`/users/${user.id}/roles`)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Manage Roles
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setUserToDelete(user);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-destructive cursor-pointer focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete User
                                                    </DropdownMenuItem>
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
            {totalPages > 0 && (
                <Pagination className="mx-auto flex justify-center">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {/* First page */}
                        {page > 2 && (
                            <PaginationItem>
                                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                            </PaginationItem>
                        )}

                        {/* Ellipsis if needed */}
                        {page > 3 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {/* Previous page */}
                        {page > 1 && (
                            <PaginationItem>
                                <PaginationLink onClick={() => setPage(page - 1)}>
                                    {page - 1}
                                </PaginationLink>
                            </PaginationItem>
                        )}

                        {/* Current page */}
                        <PaginationItem>
                            <PaginationLink isActive>{page}</PaginationLink>
                        </PaginationItem>

                        {/* Next page */}
                        {page < totalPages && (
                            <PaginationItem>
                                <PaginationLink onClick={() => setPage(page + 1)}>
                                    {page + 1}
                                </PaginationLink>
                            </PaginationItem>
                        )}

                        {/* Ellipsis if needed */}
                        {page < totalPages - 2 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {/* Last page */}
                        {page < totalPages - 1 && (
                            <PaginationItem>
                                <PaginationLink onClick={() => setPage(totalPages)}>
                                    {totalPages}
                                </PaginationLink>
                            </PaginationItem>
                        )}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Page Size Selector */}
            <div className="flex justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPage(1); // Reset to first page when changing page size
                        }}
                    >
                        <SelectTrigger className="w-16 h-8">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete User
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the user{" "}
                            <span className="font-medium">
                                {userToDelete?.firstName} {userToDelete?.lastName}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                        >
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default UsersPage;