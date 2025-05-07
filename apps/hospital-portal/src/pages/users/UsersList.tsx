// UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useUsersControllerFindAllQuery,
    useUsersControllerRemoveMutation,
} from '@/features/generatedApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
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
    Check,
    Filter,
    RefreshCw,
    SlidersHorizontal,
    ListFilter,
    Eye,
} from 'lucide-react';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useSelector } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User } from '@/lib/types';

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
    const orgId = currentUser?.organizationId;

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
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [activeView, setActiveView] = useState('table');

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
        orderBy: sort.field,
        order: sort.direction,
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

    // Delete user logic
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

    // Get initials for avatar
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Get random color for avatar based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-100 text-blue-800',
            'bg-green-100 text-green-800',
            'bg-yellow-100 text-yellow-800',
            'bg-purple-100 text-purple-800',
            'bg-pink-100 text-pink-800',
            'bg-indigo-100 text-indigo-800',
            'bg-red-100 text-red-800',
            'bg-orange-100 text-orange-800',
        ];

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Get color from hash
        return colors[Math.abs(hash) % colors.length];
    };

    const renderFilters = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                Current Organization
                            </SelectItem>
                        )}
                        {/* Add more organizations here if needed */}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderActiveFilters = () => {
        const activeFilterCount =
            (filters.firstName ? 1 : 0) +
            (filters.lastName ? 1 : 0) +
            (filters.email ? 1 : 0) +
            (filters.organizationId !== orgId ? 1 : 0);

        if (activeFilterCount === 0) return null;

        return (
            <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs font-medium text-muted-foreground">Active filters:</span>

                {filters.firstName && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        First name: {filters.firstName}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleFilterChange('firstName', '')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {filters.lastName && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        Last name: {filters.lastName}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleFilterChange('lastName', '')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {filters.email && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        Email: {filters.email}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleFilterChange('email', '')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                {filters.organizationId !== orgId && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        Organization: {filters.organizationId === null ? 'All' : 'Custom'}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleFilterChange('organizationId', orgId)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={clearFilters}
                >
                    Clear all
                </Button>
            </div>
        );
    };

    const renderTableView = () => (
        <Card className="shadow-sm border-0 overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">
                                <div
                                    className="flex items-center cursor-pointer"
                                    onClick={() => handleSort('firstName')}
                                >
                                    <span>Name</span>
                                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-70" />
                                </div>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                                <div
                                    className="flex items-center cursor-pointer"
                                    onClick={() => handleSort('email')}
                                >
                                    <span>Email</span>
                                    <ArrowUpDown className="ml-2 h-4 w-4 opacity-70" />
                                </div>
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">Organization</TableHead>
                            <TableHead className="hidden md:table-cell">Roles</TableHead>
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
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-[150px]" /></TableCell>
                                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-[120px]" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : usersData?.users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-30" />
                                        <p>No users found</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2"
                                            onClick={clearFilters}
                                        >
                                            Clear filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            usersData?.users.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className={`h-8 w-8 ${getAvatarColor(`${user.firstName} ${user.lastName}`)}`}>
                                                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.firstName} {user.lastName}</span>
                                                <span className="text-xs text-muted-foreground md:hidden">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {user.organization ? (
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <span>{user.organization.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles?.slice(0, 2).map((role) => (
                                                <Badge key={role.id} variant={role.isSystemRole ? "default" : "outline"} className="text-xs px-1.5 py-0">
                                                    {role.name}
                                                </Badge>
                                            ))}
                                            {user.roles && user.roles.length > 2 && (
                                                <Badge variant="secondary" className="text-xs px-1.5 py-0">+{user.roles.length - 2}</Badge>
                                            )}
                                            {(!user.roles || user.roles.length === 0) && (
                                                <span className="text-muted-foreground italic text-xs">No roles</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isActive ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
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
                                                    <Eye className="h-4 w-4 mr-2" />
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
            </div>
        </Card>
    );

    const renderCardView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
                // Loading skeleton for cards
                Array(8).fill(0).map((_, index) => (
                    <Card key={`skeleton-${index}`} className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-3 w-[160px]" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                            <div className="bg-muted/30 px-4 py-3 flex justify-between">
                                <Skeleton className="h-6 w-[100px]" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : usersData?.users.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-40 bg-muted/20 rounded-lg">
                    <UserIcon className="h-8 w-8 text-muted-foreground mb-2 opacity-30" />
                    <p className="text-muted-foreground">No users found</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={clearFilters}
                    >
                        Clear filters
                    </Button>
                </div>
            ) : (
                usersData?.users.map((user) => (
                    <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-0">
                            <div className="p-4">
                                <div className="flex items-center space-x-4">
                                    <Avatar className={`h-12 w-12 ${getAvatarColor(`${user.firstName} ${user.lastName}`)}`}>
                                        <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium text-sm">{user.firstName} {user.lastName}</h4>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Organization</p>
                                        <p className="text-sm truncate">
                                            {user.organization?.name || "None"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Roles</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {user.roles?.slice(0, 2).map((role) => (
                                                <Badge key={role.id} variant={role.isSystemRole ? "default" : "outline"} className="text-xs px-1.5 py-0">
                                                    {role.name}
                                                </Badge>
                                            ))}
                                            {user.roles && user.roles.length > 2 && (
                                                <Badge variant="secondary" className="text-xs px-1.5 py-0">+{user.roles.length - 2}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 px-4 py-3 flex justify-between items-center">
                                {user.isActive ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span> Inactive
                                    </Badge>
                                )}

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
                                            <Eye className="h-4 w-4 mr-2" />
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
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );

    const renderPagination = () => {
        if (totalPages <= 0) return null;

        return (
            <div className="mt-6 flex flex-col items-center gap-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {/* First page */}
                        {page > 2 && (
                            <PaginationItem className="hidden sm:inline-block">
                                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                            </PaginationItem>
                        )}

                        {/* Ellipsis if needed */}
                        {page > 3 && (
                            <PaginationItem className="hidden sm:inline-block">
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
                            <PaginationItem className="hidden sm:inline-block">
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {/* Last page */}
                        {page < totalPages - 1 && (
                            <PaginationItem className="hidden sm:inline-block">
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

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Rows per page:</span>
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

                    <span className="text-muted-foreground ml-2">
                        {usersData?.total ?
                            `${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, usersData?.total)} of ${usersData?.total}` :
                            '0 results'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <Tabs
                        value={activeView}
                        onValueChange={setActiveView}
                        className="w-full"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <TabsList className="grid w-full sm:w-auto grid-cols-2">
                                <TabsTrigger value="table" className="px-3 py-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    Table
                                </TabsTrigger>
                                <TabsTrigger value="cards" className="px-3 py-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Cards
                                </TabsTrigger>
                            </TabsList>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Sort by:</span>
                                <Select
                                    value={`${sort.field}-${sort.direction}`}
                                    onValueChange={(value) => {
                                        const [field, direction] = value.split('-');
                                        setSort({ field, direction: direction as 'asc' | 'desc' });
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs w-[130px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="firstName-asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="firstName-desc">Name (Z-A)</SelectItem>
                                        <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                                        <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                                        <SelectItem value="createdAt-desc">Newest first</SelectItem>
                                        <SelectItem value="createdAt-asc">Oldest first</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {renderActiveFilters()}

                        {/* TabsContent must be inside the Tabs component */}
                        <TabsContent value="table" className="m-0 mt-2">
                            {renderTableView()}
                        </TabsContent>

                        <TabsContent value="cards" className="m-0 mt-2">
                            {renderCardView()}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
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

                    <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 mt-2">
                        <p className="text-sm text-destructive flex items-start">
                            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            Deleting this user will remove all of their data and access to the platform.
                        </p>
                    </div>

                    <DialogFooter className="flex sm:justify-between gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="sm:flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            className="sm:flex-1"
                            disabled={isRemovingUser}
                        >
                            {isRemovingUser ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                "Delete User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default UsersPage;