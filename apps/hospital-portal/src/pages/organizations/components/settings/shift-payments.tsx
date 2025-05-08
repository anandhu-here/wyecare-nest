"use client"

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

// Shadcn Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Icons
import {
    AlarmClock,
    AlertCircle,
    ArrowUpDown,
    Calendar,
    Clock,
    Copy,
    DollarSign,
    Edit,
    EllipsisVertical,
    FileClock,
    FileSpreadsheet,
    Filter,
    Info,
    Loader2,
    MoonStar,
    MoreHorizontal,
    Pencil,
    Plus,
    Save,
    Search,
    Settings,
    Sun,
    Trash2,
    X,
    Users,
    Briefcase,
    SlidersHorizontal,
    CalendarClock,
} from 'lucide-react'

// Redux selectors
import { selectCurrentOrganization, selectCurrentUser } from '@/features/auth/authSlice'
import { usePaymentRulesControllerCreateMutation, usePaymentRulesControllerFindByOrganizationQuery, usePaymentRulesControllerRemoveMutation, usePaymentRulesControllerUpdateMutation, useRolesControllerFindAllQuery, useShiftTypesControllerFindAllQuery } from '@/features/generatedApi'

// Placeholder for API types - you'll replace these with actual types later
interface ShiftType {
    id: string;
    name: string;
    startTime: string | Date;
    endTime: string | Date;
    isOvernight: boolean;
    hoursCount: number;
    basePayMultiplier: number;
    description?: string;
    organizationId: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
}

interface PaymentRule {
    id: string;
    shiftTypeId: string;
    roleId: string;
    paymentType: 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'PER_SHIFT';
    baseRate: number;
    specialtyBonus?: number;
    experienceMultiplier?: number;
    effectiveDate: string | Date;
    endDate?: string | Date;
    shiftType?: ShiftType;
    role?: Role;
}

// Empty placeholder functions for API calls
const useGetShiftTypesQuery = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return {
        data: [
            {
                id: '1',
                name: 'Morning Shift',
                startTime: '08:00:00',
                endTime: '16:00:00',
                isOvernight: false,
                hoursCount: 8,
                basePayMultiplier: 1,
                description: 'Standard morning shift',
                organizationId: '1'
            },
            {
                id: '2',
                name: 'Evening Shift',
                startTime: '16:00:00',
                endTime: '00:00:00',
                isOvernight: false,
                hoursCount: 8,
                basePayMultiplier: 1.15,
                description: 'Evening shift with 15% premium',
                organizationId: '1'
            },
            {
                id: '3',
                name: 'Night Shift',
                startTime: '00:00:00',
                endTime: '08:00:00',
                isOvernight: true,
                hoursCount: 8,
                basePayMultiplier: 1.25,
                description: 'Overnight shift with 25% premium',
                organizationId: '1'
            }
        ],
        isLoading: false,
        isError: false,
        refetch: () => { }
    };
};

const useGetRolesQuery = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return {
        data: [
            { id: '1', name: 'Nurse', description: 'Registered Nurse' },
            { id: '2', name: 'Doctor', description: 'Physician' },
            { id: '3', name: 'Receptionist', description: 'Front desk staff' },
            { id: '4', name: 'Administrator', description: 'Administrative staff' }
        ],
        isLoading: false,
        isError: false,
        refetch: () => { }
    };
};

const useGetPaymentRulesQuery = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return {
        data: [
            {
                id: '1',
                shiftTypeId: '1',
                roleId: '1',
                paymentType: 'HOURLY',
                baseRate: 25.50,
                specialtyBonus: 2.00,
                experienceMultiplier: 1.0,
                effectiveDate: '2025-01-01',
                shiftType: { id: '1', name: 'Morning Shift' },
                role: { id: '1', name: 'Nurse' }
            },
            {
                id: '2',
                shiftTypeId: '2',
                roleId: '1',
                paymentType: 'HOURLY',
                baseRate: 28.00,
                specialtyBonus: 2.00,
                experienceMultiplier: 1.0,
                effectiveDate: '2025-01-01',
                shiftType: { id: '2', name: 'Evening Shift' },
                role: { id: '1', name: 'Nurse' }
            },
            {
                id: '3',
                shiftTypeId: '1',
                roleId: '2',
                paymentType: 'HOURLY',
                baseRate: 85.00,
                specialtyBonus: 0,
                experienceMultiplier: 1.0,
                effectiveDate: '2025-01-01',
                shiftType: { id: '1', name: 'Morning Shift' },
                role: { id: '2', name: 'Doctor' }
            }
        ] as PaymentRule[],
        isLoading: false,
        isError: false,
        refetch: () => { }
    };
};

const useCreatePaymentRuleMutation = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return [
        (data: any) => {
            console.log('Creating payment rule:', data);
            return Promise.resolve({ id: 'new-id', ...data });
        },
        { isLoading: false }
    ];
};

const useUpdatePaymentRuleMutation = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return [
        (data: any) => {
            console.log('Updating payment rule:', data);
            return Promise.resolve({ id: data.id, ...data.updatePaymentRuleDto });
        },
        { isLoading: false }
    ];
};

const useDeletePaymentRuleMutation = () => {
    // This is a placeholder - you'll replace with actual RTK Query hook
    return [
        (id: string) => {
            console.log('Deleting payment rule:', id);
            return Promise.resolve({ id });
        },
        { isLoading: false }
    ];
};

// Helper function to format time
const formatTime = (time: string | Date): string => {
    if (typeof time === 'string') {
        // Assuming time is in HH:MM:SS format
        return time.substring(0, 5);
    }
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

const ShiftPaymentsPage = () => {
    const [activeTab, setActiveTab] = useState("payment-rules")
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState<string>('')
    const [filterShiftType, setFilterShiftType] = useState<string>('')

    // Dialog states
    const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)
    const [isEditRuleOpen, setIsEditRuleOpen] = useState(false)
    const [isDeleteRuleOpen, setIsDeleteRuleOpen] = useState(false)
    const [currentRule, setCurrentRule] = useState<PaymentRule | null>(null)

    const currentUser = useSelector(selectCurrentUser)

    // Form state
    const [paymentRuleForm, setPaymentRuleForm] = useState<{
        shiftTypeId: string;
        roleId: string;
        paymentType: 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'PER_SHIFT';
        baseRate: number;
        specialtyBonus: number;
        experienceMultiplier: number;
        effectiveDate: string;
        endDate?: string;
    }>({
        shiftTypeId: '',
        roleId: '',
        paymentType: 'HOURLY',
        baseRate: 0,
        specialtyBonus: 0,
        experienceMultiplier: 1.0,
        effectiveDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    })

    const currentOrganization = useSelector(selectCurrentOrganization)

    // Placeholder API hooks - replace with actual RTK Query hooks later
    const {
        data: shiftTypes = [],
        isLoading: isLoadingShiftTypes,
        refetch: refetchShiftTypes
    } = useShiftTypesControllerFindAllQuery({
        organizationId: currentUser?.organizationId as any,
    })

    const {
        data: rolesData,
        isLoading: isLoadingRoles,
        refetch: refetchRoles
    } = useRolesControllerFindAllQuery({
        take: 100,
        isSystemRole: true,
        organizationId: currentUser?.organizationId
    }, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
        refetchOnMountOrArgChange: true,
    });

    const {
        data: paymentRules = [],
        isLoading: isLoadingPaymentRules,
        refetch: refetchPaymentRules
    } = usePaymentRulesControllerFindByOrganizationQuery({
        organizationId: currentUser?.organizationId as any,
    })

    const [createPaymentRule, { isLoading: isCreatingPaymentRule }] = usePaymentRulesControllerCreateMutation()
    const [updatePaymentRule, { isLoading: isUpdatingPaymentRule }] = usePaymentRulesControllerUpdateMutation()
    const [deletePaymentRule, { isLoading: isDeletingPaymentRule }] = usePaymentRulesControllerRemoveMutation()

    // Filter payment rules based on search and filters
    const filteredPaymentRules = paymentRules?.filter(rule => {
        const matchesSearch = searchTerm === '' ||
            rule.role?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.shiftType?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRole === '' || rule.roleId === filterRole;
        const matchesShiftType = filterShiftType === '' || rule.shiftTypeId === filterShiftType;

        return matchesSearch && matchesRole && matchesShiftType;
    });

    // Sort payment rules: first by role name, then by shift type name
    const sortedPaymentRules = [...(filteredPaymentRules || [])].sort((a, b) => {
        const roleNameA = a.role?.name || '';
        const roleNameB = b.role?.name || '';
        const shiftNameA = a.shiftType?.name || '';
        const shiftNameB = b.shiftType?.name || '';

        return roleNameA.localeCompare(roleNameB) || shiftNameA.localeCompare(shiftNameB);
    });

    // Handle form field changes
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentRuleForm(prev => ({
            ...prev,
            [name]: name === 'baseRate' || name === 'specialtyBonus' || name === 'experienceMultiplier'
                ? parseFloat(value)
                : value
        }));
    };

    // Open add rule dialog
    const handleAddRule = () => {
        setPaymentRuleForm({
            shiftTypeId: '',
            roleId: '',
            paymentType: 'HOURLY',
            baseRate: 0,
            specialtyBonus: 0,
            experienceMultiplier: 1.0,
            effectiveDate: new Date().toISOString().split('T')[0],
        });
        setIsAddRuleOpen(true);
    };

    // Open edit rule dialog
    const handleEditRule = (rule: PaymentRule) => {
        setCurrentRule(rule);
        setPaymentRuleForm({
            shiftTypeId: rule.shiftTypeId,
            roleId: rule.roleId,
            paymentType: rule.paymentType,
            baseRate: rule.baseRate,
            specialtyBonus: rule.specialtyBonus || 0,
            experienceMultiplier: rule.experienceMultiplier || 1.0,
            effectiveDate: typeof rule.effectiveDate === 'string'
                ? rule.effectiveDate.split('T')[0]
                : new Date(rule.effectiveDate).toISOString().split('T')[0],
            endDate: rule.endDate
                ? (typeof rule.endDate === 'string'
                    ? rule.endDate.split('T')[0]
                    : new Date(rule.endDate).toISOString().split('T')[0])
                : undefined
        });
        setIsEditRuleOpen(true);
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (rule: PaymentRule) => {
        setCurrentRule(rule);
        setIsDeleteRuleOpen(true);
    };

    // Submit new payment rule
    const handleCreateRule = async () => {
        if (!currentOrganization?.id) return;

        try {
            await createPaymentRule({
                ...paymentRuleForm,
                organizationId: currentOrganization.id
            });
            setIsAddRuleOpen(false);
            refetchPaymentRules();
        } catch (error) {
            console.error('Failed to create payment rule:', error);
        }
    };

    // Update existing payment rule
    const handleUpdateRule = async () => {
        if (!currentRule?.id) return;

        try {
            await updatePaymentRule({
                id: currentRule.id,
                updatePaymentRuleDto: paymentRuleForm
            });
            setIsEditRuleOpen(false);
            refetchPaymentRules();
        } catch (error) {
            console.error('Failed to update payment rule:', error);
        }
    };

    // Delete payment rule
    const handleDeleteRule = async () => {
        if (!currentRule?.id) return;

        try {
            await deletePaymentRule(currentRule.id);
            setIsDeleteRuleOpen(false);
            refetchPaymentRules();
        } catch (error) {
            console.error('Failed to delete payment rule:', error);
        }
    };

    // Get the name of a role by ID
    const getRoleName = (roleId: string): string => {
        return rolesData?.roles?.find(role => role.id === roleId)?.name || 'Unknown Role';
    };

    // Get the name of a shift type by ID
    const getShiftTypeName = (shiftTypeId: string): string => {
        return shiftTypes?.find(shift => shift.id === shiftTypeId)?.name || 'Unknown Shift';
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm('');
        setFilterRole('');
        setFilterShiftType('');
    };

    // Payment type label
    const getPaymentTypeLabel = (type: string): string => {
        switch (type) {
            case 'HOURLY': return 'Hourly Rate';
            case 'WEEKLY': return 'Weekly Rate';
            case 'MONTHLY': return 'Monthly Rate';
            case 'PER_SHIFT': return 'Per Shift';
            default: return type;
        }
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <Tabs
                defaultValue="payment-rules"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex flex-col h-full overflow-hidden"
            >
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="payment-rules" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Payment Rules
                        </TabsTrigger>
                        <TabsTrigger value="payment-history" className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Payment History
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "payment-rules" && (
                        <Button onClick={handleAddRule} className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add Payment Rule
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    {/* Payment Rules Tab */}
                    <TabsContent
                        value="payment-rules"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <Card className="h-full flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl">Payment Rules</CardTitle>
                                <CardDescription>
                                    Configure payment rates for different roles and shift types
                                </CardDescription>

                                {/* Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search rules..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <Select
                                        value={filterRole}
                                        onValueChange={setFilterRole}
                                        onOpenChange={refetchRoles}
                                    >
                                        <SelectTrigger className="flex gap-2">
                                            <Users className="h-4 w-4" />
                                            <SelectValue placeholder="Filter by role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Roles</SelectItem>
                                            {rolesData?.roles?.map(role => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filterShiftType}
                                        onValueChange={setFilterShiftType}
                                    >
                                        <SelectTrigger className="flex gap-2">
                                            <CalendarClock className="h-4 w-4" />
                                            <SelectValue placeholder="Filter by shift type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Shift Types</SelectItem>
                                            {shiftTypes?.map(shift => (
                                                <SelectItem key={shift.id} value={shift.id}>
                                                    {shift.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-hidden p-0">
                                {isLoadingPaymentRules ? (
                                    <div className="p-4 space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center space-x-4">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[200px]" />
                                                    <Skeleton className="h-4 w-[160px]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border rounded-md h-full overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Role</TableHead>
                                                        <TableHead>Shift Type</TableHead>
                                                        <TableHead>Payment Type</TableHead>
                                                        <TableHead>Base Rate</TableHead>
                                                        <TableHead>Additional</TableHead>
                                                        <TableHead>Effective Date</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedPaymentRules.length > 0 ? (
                                                        sortedPaymentRules.map((rule) => (
                                                            <TableRow key={rule.id}>
                                                                <TableCell className="font-medium">
                                                                    {rule.role?.name || getRoleName(rule.roleId)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {rule.shiftType?.name || getShiftTypeName(rule.shiftTypeId)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                        {getPaymentTypeLabel(rule.paymentType)}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="font-medium text-green-700">
                                                                        {formatCurrency(rule.baseRate)}
                                                                    </span>
                                                                    {rule.paymentType === 'HOURLY' && <span className="text-muted-foreground text-xs"> /hr</span>}
                                                                    {rule.paymentType === 'WEEKLY' && <span className="text-muted-foreground text-xs"> /week</span>}
                                                                    {rule.paymentType === 'MONTHLY' && <span className="text-muted-foreground text-xs"> /month</span>}
                                                                    {rule.paymentType === 'PER_SHIFT' && <span className="text-muted-foreground text-xs"> /shift</span>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {rule.specialtyBonus > 0 && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                                                                                        +{formatCurrency(rule.specialtyBonus)}
                                                                                    </Badge>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Specialty Bonus</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                    {rule.experienceMultiplier > 1.0 && (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                                        {rule.experienceMultiplier}x
                                                                                    </Badge>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Experience Multiplier</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col">
                                                                        <span>{new Date(rule.effectiveDate).toLocaleDateString()}</span>
                                                                        {rule.endDate && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Expires: {new Date(rule.endDate).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                                <span className="sr-only">Open menu</span>
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-destructive focus:text-destructive"
                                                                                onClick={() => handleDeleteClick(rule)}
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="h-24 text-center">
                                                                {filterRole || filterShiftType || searchTerm ? (
                                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                                        <Search className="h-8 w-8 mb-2" />
                                                                        <p>No payment rules match your filters</p>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="mt-2"
                                                                            onClick={resetFilters}
                                                                        >
                                                                            Reset Filters
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                                        <DollarSign className="h-8 w-8 mb-2" />
                                                                        <p>No payment rules defined yet</p>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="mt-2"
                                                                            onClick={handleAddRule}
                                                                        >
                                                                            <Plus className="mr-1 h-4 w-4" />
                                                                            Add your first payment rule
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment History Tab */}
                    <TabsContent
                        value="payment-history"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <Card className="h-full flex flex-col overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl">Payment History</CardTitle>
                                <CardDescription>
                                    View and manage past and upcoming staff payments
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-5 overflow-auto">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Payment history management</AlertTitle>
                                    <AlertDescription>
                                        This section will allow you to view and manage payment history, including
                                        generating reports and exporting data. This feature is under development.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Add Payment Rule Dialog */}
            <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Add Payment Rule</DialogTitle>
                        <DialogDescription>
                            Create a new payment rule for a role and shift type
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="roleId">Role</Label>
                                <Select
                                    value={paymentRuleForm.roleId}
                                    onValueChange={(value) => setPaymentRuleForm(prev => ({ ...prev, roleId: value }))}
                                >
                                    <SelectTrigger id="roleId">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rolesData?.roles?.map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shiftTypeId">Shift Type</Label>
                                <Select
                                    value={paymentRuleForm.shiftTypeId}
                                    onValueChange={(value) => setPaymentRuleForm(prev => ({ ...prev, shiftTypeId: value }))}
                                >
                                    <SelectTrigger id="shiftTypeId">
                                        <SelectValue placeholder="Select shift type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shiftTypes?.map(shift => (
                                            <SelectItem key={shift.id} value={shift.id}>
                                                {shift.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentType">Payment Type</Label>
                            <RadioGroup
                                value={paymentRuleForm.paymentType}
                                onValueChange={(value: 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'PER_SHIFT') =>
                                    setPaymentRuleForm(prev => ({ ...prev, paymentType: value }))}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="HOURLY" id="hourly" />
                                    <Label htmlFor="hourly" className="cursor-pointer">Hourly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="WEEKLY" id="weekly" />
                                    <Label htmlFor="weekly" className="cursor-pointer">Weekly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="MONTHLY" id="monthly" />
                                    <Label htmlFor="monthly" className="cursor-pointer">Monthly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PER_SHIFT" id="per-shift" />
                                    <Label htmlFor="per-shift" className="cursor-pointer">Per Shift</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="baseRate">
                                Base {paymentRuleForm.paymentType === 'HOURLY' ? 'Hourly ' : ''}
                                {paymentRuleForm.paymentType === 'WEEKLY' ? 'Weekly ' : ''}
                                {paymentRuleForm.paymentType === 'MONTHLY' ? 'Monthly ' : ''}
                                {paymentRuleForm.paymentType === 'PER_SHIFT' ? 'Per Shift ' : ''}
                                Rate
                            </Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="baseRate"
                                    name="baseRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-8"
                                    value={paymentRuleForm.baseRate}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="specialtyBonus">Specialty Bonus</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="specialtyBonus"
                                        name="specialtyBonus"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-8"
                                        value={paymentRuleForm.specialtyBonus}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Additional amount for specialized roles
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experienceMultiplier">Experience Multiplier</Label>
                                <Input
                                    id="experienceMultiplier"
                                    name="experienceMultiplier"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={paymentRuleForm.experienceMultiplier}
                                    onChange={handleFormChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Multiplier applied based on experience (e.g., 1.2 = 20% increase)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveDate">Effective Date</Label>
                                <Input
                                    id="effectiveDate"
                                    name="effectiveDate"
                                    type="date"
                                    value={paymentRuleForm.effectiveDate}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    value={paymentRuleForm.endDate || ''}
                                    onChange={handleFormChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for indefinite validity
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRule}
                            disabled={
                                !paymentRuleForm.roleId ||
                                !paymentRuleForm.shiftTypeId ||
                                paymentRuleForm.baseRate <= 0 ||
                                isCreatingPaymentRule
                            }
                        >
                            {isCreatingPaymentRule ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Payment Rule
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Payment Rule Dialog */}
            <Dialog open={isEditRuleOpen} onOpenChange={setIsEditRuleOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Edit Payment Rule</DialogTitle>
                        <DialogDescription>
                            Update payment rule details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-roleId">Role</Label>
                                <Select
                                    value={paymentRuleForm.roleId}
                                    onValueChange={(value) => setPaymentRuleForm(prev => ({ ...prev, roleId: value }))}
                                >
                                    <SelectTrigger id="edit-roleId">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rolesData?.roles?.map(role => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-shiftTypeId">Shift Type</Label>
                                <Select
                                    value={paymentRuleForm.shiftTypeId}
                                    onValueChange={(value) => setPaymentRuleForm(prev => ({ ...prev, shiftTypeId: value }))}
                                >
                                    <SelectTrigger id="edit-shiftTypeId">
                                        <SelectValue placeholder="Select shift type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shiftTypes?.map(shift => (
                                            <SelectItem key={shift.id} value={shift.id}>
                                                {shift.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-paymentType">Payment Type</Label>
                            <RadioGroup
                                value={paymentRuleForm.paymentType}
                                onValueChange={(value: 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'PER_SHIFT') =>
                                    setPaymentRuleForm(prev => ({ ...prev, paymentType: value }))}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="HOURLY" id="edit-hourly" />
                                    <Label htmlFor="edit-hourly" className="cursor-pointer">Hourly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="WEEKLY" id="edit-weekly" />
                                    <Label htmlFor="edit-weekly" className="cursor-pointer">Weekly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="MONTHLY" id="edit-monthly" />
                                    <Label htmlFor="edit-monthly" className="cursor-pointer">Monthly Rate</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="PER_SHIFT" id="edit-per-shift" />
                                    <Label htmlFor="edit-per-shift" className="cursor-pointer">Per Shift</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-baseRate">
                                Base {paymentRuleForm.paymentType === 'HOURLY' ? 'Hourly ' : ''}
                                {paymentRuleForm.paymentType === 'WEEKLY' ? 'Weekly ' : ''}
                                {paymentRuleForm.paymentType === 'MONTHLY' ? 'Monthly ' : ''}
                                {paymentRuleForm.paymentType === 'PER_SHIFT' ? 'Per Shift ' : ''}
                                Rate
                            </Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-baseRate"
                                    name="baseRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-8"
                                    value={paymentRuleForm.baseRate}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-specialtyBonus">Specialty Bonus</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="edit-specialtyBonus"
                                        name="specialtyBonus"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-8"
                                        value={paymentRuleForm.specialtyBonus}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Additional amount for specialized roles
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-experienceMultiplier">Experience Multiplier</Label>
                                <Input
                                    id="edit-experienceMultiplier"
                                    name="experienceMultiplier"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={paymentRuleForm.experienceMultiplier}
                                    onChange={handleFormChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Multiplier applied based on experience (e.g., 1.2 = 20% increase)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-effectiveDate">Effective Date</Label>
                                <Input
                                    id="edit-effectiveDate"
                                    name="effectiveDate"
                                    type="date"
                                    value={paymentRuleForm.effectiveDate}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                                <Input
                                    id="edit-endDate"
                                    name="endDate"
                                    type="date"
                                    value={paymentRuleForm.endDate || ''}
                                    onChange={handleFormChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for indefinite validity
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditRuleOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateRule}
                            disabled={
                                !paymentRuleForm.roleId ||
                                !paymentRuleForm.shiftTypeId ||
                                paymentRuleForm.baseRate <= 0 ||
                                isUpdatingPaymentRule
                            }
                        >
                            {isUpdatingPaymentRule ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Payment Rule
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteRuleOpen} onOpenChange={setIsDeleteRuleOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Payment Rule</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment rule? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {currentRule && (
                        <div className="py-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                                <div className="font-medium flex items-center justify-between">
                                    <span>{getRoleName(currentRule.roleId)}</span>
                                    <Badge variant="outline">
                                        {getShiftTypeName(currentRule.shiftTypeId)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <div className="flex justify-between">
                                        <span>{getPaymentTypeLabel(currentRule.paymentType)}</span>
                                        <span className="font-medium">{formatCurrency(currentRule.baseRate)}</span>
                                    </div>
                                    <div className="mt-1">
                                        Effective from: {new Date(currentRule.effectiveDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-destructive">
                                <p>Warning: Deleting this rule may affect staff payment calculations.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteRuleOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteRule}
                            disabled={isDeletingPaymentRule}
                        >
                            {isDeletingPaymentRule ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Rule
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ShiftPaymentsPage