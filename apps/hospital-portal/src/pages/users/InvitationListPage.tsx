import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '@/lib/casl/AbilityContext';
import { format, isAfter } from 'date-fns';
import { Clipboard, RotateCw, RefreshCw, UserPlus, Clock, Check, X, AlertTriangle, Copy } from 'lucide-react';

// Import UI components
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';

// Placeholder hooks - Replace with your actual API hooks
const useGetInvitationsQuery = (params: any) => {
    // This would be replaced with your actual RTK Query hook
    return {
        data: {
            invitations: [
                {
                    id: '1',
                    email: 'doctor@example.com',
                    role: { id: '2', name: 'Doctor' },
                    department: { id: '2', name: 'Cardiology' },
                    status: 'PENDING',
                    createdAt: '2023-05-01T10:30:00.000Z',
                    expiresAt: '2023-05-08T10:30:00.000Z',
                    createdBy: { id: '1', name: 'Admin User' }
                },
                {
                    id: '2',
                    email: 'nurse@example.com',
                    role: { id: '3', name: 'Nurse' },
                    department: { id: '2', name: 'Cardiology' },
                    status: 'PENDING',
                    createdAt: '2023-05-02T14:45:00.000Z',
                    expiresAt: '2023-05-09T14:45:00.000Z',
                    createdBy: { id: '1', name: 'Admin User' }
                },
                {
                    id: '3',
                    email: 'receptionist@example.com',
                    role: { id: '4', name: 'Receptionist' },
                    department: null,
                    status: 'ACCEPTED',
                    createdAt: '2023-04-28T09:15:00.000Z',
                    expiresAt: '2023-05-05T09:15:00.000Z',
                    acceptedAt: '2023-04-29T11:20:00.000Z',
                    createdBy: { id: '1', name: 'Admin User' }
                },
                {
                    id: '4',
                    email: 'technician@example.com',
                    role: { id: '5', name: 'Lab Technician' },
                    department: { id: '5', name: 'Laboratory' },
                    status: 'EXPIRED',
                    createdAt: '2023-04-20T16:30:00.000Z',
                    expiresAt: '2023-04-27T16:30:00.000Z',
                    createdBy: { id: '1', name: 'Admin User' }
                }
            ],
            pagination: {
                total: 4,
                page: 1,
                limit: 10,
                totalPages: 1
            }
        },
        isLoading: false,
        error: null,
        refetch: () => { }
    };
};

const useResendInvitationMutation = () => {
    return [
        async (id: string) => {
            // Simulate API call
            console.log('Resending invitation:', id);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true };
        },
        { isLoading: false }
    ] as const;
};

const useRevokeInvitationMutation = () => {
    return [
        async (id: string) => {
            // Simulate API call
            console.log('Revoking invitation:', id);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true };
        },
        { isLoading: false }
    ] as const;
};

export function InvitationsListPage() {
    const navigate = useNavigate();
    const ability = useAbility();

    // Filter state
    const [status, setStatus] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Fetch invitations
    const { data, isLoading, refetch } = useGetInvitationsQuery({
        status: status !== 'all' ? status : undefined,
        search,
        page,
        limit: 10
    });

    // Mutations
    const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();
    const [revokeInvitation, { isLoading: isRevoking }] = useRevokeInvitationMutation();

    // Check permissions
    const canInviteUsers = ability.can('invite', 'User');

    // Handle resend invitation
    const handleResend = async (id: string) => {
        try {
            await resendInvitation(id);
            toast.success('Invitation resent successfully!');
            refetch();
        } catch (error) {
            toast.error('Failed to resend invitation.');
        }
    };

    // Handle revoke invitation
    const handleRevoke = async (id: string) => {
        try {
            await revokeInvitation(id);
            toast.success('Invitation revoked successfully!');
            refetch();
        } catch (error) {
            toast.error('Failed to revoke invitation.');
        }
    };

    // Copy invitation link
    const copyInvitationLink = (id: string) => {
        // In a real application, you would need to get the actual invitation link
        const link = `${window.location.origin}/accept-invitation/${id}`;
        navigator.clipboard.writeText(link);
        toast.success('Invitation link copied to clipboard!');
    };

    // Get status badge
    const getStatusBadge = (status: string, expiresAt: string) => {
        if (status === 'ACCEPTED') {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    <Check className="h-3 w-3 mr-1" />
                    Accepted
                </Badge>
            );
        }

        if (status === 'EXPIRED' || (status === 'PENDING' && isAfter(new Date(), new Date(expiresAt)))) {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                </Badge>
            );
        }

        if (status === 'REVOKED') {
            return (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    <X className="h-3 w-3 mr-1" />
                    Revoked
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                <RefreshCw className="h-3 w-3 mr-1" />
                Pending
            </Badge>
        );
    };

    const invitations = data?.invitations || [];
    const total = data?.pagination?.total || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage user invitations to your organization
                    </p>
                </div>

                {canInviteUsers && (
                    <Button
                        onClick={() => navigate('/users/invite')}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Invitations</CardTitle>
                    <CardDescription>
                        View and manage invitations sent to join your organization
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="all" onValueChange={(value) => setStatus(value)}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                                <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
                                <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Search emails..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-60"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="m-0">
                            <InvitationsTable
                                invitations={invitations}
                                isLoading={isLoading}
                                onResend={handleResend}
                                onRevoke={handleRevoke}
                                onCopyLink={copyInvitationLink}
                                getStatusBadge={getStatusBadge}
                            />
                        </TabsContent>

                        <TabsContent value="PENDING" className="m-0">
                            <InvitationsTable
                                invitations={invitations.filter(inv => inv.status === 'PENDING')}
                                isLoading={isLoading}
                                onResend={handleResend}
                                onRevoke={handleRevoke}
                                onCopyLink={copyInvitationLink}
                                getStatusBadge={getStatusBadge}
                            />
                        </TabsContent>

                        <TabsContent value="ACCEPTED" className="m-0">
                            <InvitationsTable
                                invitations={invitations.filter(inv => inv.status === 'ACCEPTED')}
                                isLoading={isLoading}
                                onResend={handleResend}
                                onRevoke={handleRevoke}
                                onCopyLink={copyInvitationLink}
                                getStatusBadge={getStatusBadge}
                            />
                        </TabsContent>

                        <TabsContent value="EXPIRED" className="m-0">
                            <InvitationsTable
                                invitations={invitations.filter(inv =>
                                    inv.status === 'EXPIRED' ||
                                    (inv.status === 'PENDING' && isAfter(new Date(), new Date(inv.expiresAt)))
                                )}
                                isLoading={isLoading}
                                onResend={handleResend}
                                onRevoke={handleRevoke}
                                onCopyLink={copyInvitationLink}
                                getStatusBadge={getStatusBadge}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

// Invitations table component
interface InvitationsTableProps {
    invitations: any[];
    isLoading: boolean;
    onResend: (id: string) => void;
    onRevoke: (id: string) => void;
    onCopyLink: (id: string) => void;
    getStatusBadge: (status: string, expiresAt: string) => React.ReactNode;
}

const InvitationsTable: React.FC<InvitationsTableProps> = ({
    invitations,
    isLoading,
    onResend,
    onRevoke,
    onCopyLink,
    getStatusBadge
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <div className="text-center py-12">
                <Clipboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No invitations found</h3>
                <p className="text-muted-foreground mt-1">
                    No invitations match your current filters
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invitations.map((invitation) => {
                    const isPending = invitation.status === 'PENDING' &&
                        !isAfter(new Date(), new Date(invitation.expiresAt));

                    return (
                        <TableRow key={invitation.id}>
                            <TableCell className="font-medium">{invitation.email}</TableCell>
                            <TableCell>{invitation.role.name}</TableCell>
                            <TableCell>
                                {invitation.department ? invitation.department.name : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(invitation.status, invitation.expiresAt)}
                            </TableCell>
                            <TableCell>
                                {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                                {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <span className="sr-only">Open menu</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                            </svg>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onCopyLink(invitation.id)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy Link
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {isPending && (
                                            <>
                                                <DropdownMenuItem onClick={() => onResend(invitation.id)}>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    Resend
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onRevoke(invitation.id)}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Revoke
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {!isPending && invitation.status !== 'ACCEPTED' && (
                                            <DropdownMenuItem onClick={() => onResend(invitation.id)}>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Send New Invitation
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default InvitationsListPage;