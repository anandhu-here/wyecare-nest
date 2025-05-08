// src/pages/CompensationRatesTab.tsx

import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Search,
    Plus,
    Edit2,
    Trash2,
    MoreHorizontal,
    Loader2,
    Save,
    CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';

// UI Components
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/util';

// API hooks
import {
    useStaffCompensationRatesControllerCreateMutation,
    useStaffCompensationRatesControllerFindAllQuery,
    useStaffCompensationRatesControllerFindOneQuery,
    useStaffCompensationRatesControllerRemoveMutation,
    useStaffCompensationRatesControllerUpdateMutation,
} from '@/features/generatedApi';

// Types from parent
import { PaymentType, CompensationFormValues, formatCurrency } from '../staff-compensation';

interface CompensationRatesTabProps {
    organizationId: string;
    staffProfiles: any[];
    departments: any[];
    shiftTypes: any[];
    getStaffName: (id: string) => string;
    getDepartmentName: (id: string) => string;
    getShiftTypeName: (id: string) => string;
    getPaymentTypeLabel: (type: PaymentType) => string;
    setActiveTab: (tab: string) => void;
}

const CompensationRatesTab = ({
    organizationId,
    staffProfiles,
    departments,
    shiftTypes,
    getStaffName,
    getDepartmentName,
    getShiftTypeName,
    getPaymentTypeLabel,
    setActiveTab
}: CompensationRatesTabProps) => {
    // Filter states
    const [compensationFilters, setCompensationFilters] = useState({
        staffProfileId: '',
        departmentId: '',
        paymentType: '' as PaymentType | '',
        active: true,
        searchTerm: '',
    });

    // Modal states
    const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);
    const [isDeleteCompensationModalOpen, setIsDeleteCompensationModalOpen] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

    // Selected items for edit/delete
    const [selectedCompensationId, setSelectedCompensationId] = useState<string | null>(null);

    // Form states
    const [compensationForm, setCompensationForm] = useState<CompensationFormValues>({
        staffProfileId: '',
        departmentId: '',
        baseRate: 0,
        paymentType: 'HOURLY',
        specialtyBonus: 0,
        experienceMultiplier: 1.0,
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
    });

    // Staff compensation rate queries
    const {
        data: compensationRates = [],
        isLoading: isLoadingCompensationRates,
        refetch: refetchCompensationRates,
    } = useStaffCompensationRatesControllerFindAllQuery({
        staffProfileId: compensationFilters.staffProfileId || undefined,
        departmentId: compensationFilters.departmentId || undefined,
        paymentType: compensationFilters.paymentType || undefined,
        active: compensationFilters.active,
        includePremiums: true,
    });

    const {
        data: selectedCompensation,
        isLoading: isLoadingSelectedCompensation
    } = useStaffCompensationRatesControllerFindOneQuery(
        { id: selectedCompensationId || '', includePremiums: true },
        { skip: !selectedCompensationId }
    );

    // Mutations
    const [createCompensationRate, { isLoading: isCreatingCompensation }] =
        useStaffCompensationRatesControllerCreateMutation();

    const [updateCompensationRate, { isLoading: isUpdatingCompensation }] =
        useStaffCompensationRatesControllerUpdateMutation();

    const [deleteCompensationRate, { isLoading: isDeletingCompensation }] =
        useStaffCompensationRatesControllerRemoveMutation();

    // Effect to update form when selecting a compensation rate for editing
    useEffect(() => {
        if (selectedCompensation) {
            setCompensationForm({
                staffProfileId: selectedCompensation.staffProfileId,
                departmentId: selectedCompensation.departmentId,
                baseRate: parseFloat(selectedCompensation.baseRate),
                paymentType: selectedCompensation.paymentType,
                specialtyBonus: parseFloat(selectedCompensation.specialtyBonus),
                experienceMultiplier: selectedCompensation.experienceMultiplier,
                effectiveDate: new Date(selectedCompensation.effectiveDate).toISOString().split('T')[0],
                endDate: selectedCompensation.endDate
                    ? new Date(selectedCompensation.endDate).toISOString().split('T')[0]
                    : undefined,
            });
        }
    }, [selectedCompensation]);

    // Handlers
    const handleCreateCompensation = async () => {
        if (!organizationId) return;

        try {
            await createCompensationRate({
                ...compensationForm
            }).unwrap();

            setIsCompensationModalOpen(false);
            setCompensationForm({
                staffProfileId: '',
                departmentId: '',
                baseRate: 0,
                paymentType: 'HOURLY',
                specialtyBonus: 0,
                experienceMultiplier: 1.0,
                effectiveDate: new Date().toISOString().split('T')[0],
                endDate: undefined,
            });

            await refetchCompensationRates();
        } catch (error) {
            console.error('Failed to create compensation rate:', error);
        }
    };

    const handleUpdateCompensation = async () => {
        if (!selectedCompensationId) return;

        try {
            await updateCompensationRate({
                id: selectedCompensationId,
                updateDto: compensationForm,
            }).unwrap();

            setIsCompensationModalOpen(false);
            setSelectedCompensationId(null);
            await refetchCompensationRates();
        } catch (error) {
            console.error('Failed to update compensation rate:', error);
        }
    };

    const handleDeleteCompensation = async () => {
        if (!selectedCompensationId) return;

        try {
            await deleteCompensationRate(selectedCompensationId).unwrap();
            setIsDeleteCompensationModalOpen(false);
            setSelectedCompensationId(null);
            await refetchCompensationRates();
        } catch (error) {
            console.error('Failed to delete compensation rate:', error);
        }
    };

    // Filter functions
    const filteredCompensationRates = compensationRates.filter(rate => {
        if (compensationFilters.searchTerm) {
            const staffName = getStaffName(rate.staffProfileId).toLowerCase();
            const deptName = getDepartmentName(rate.departmentId).toLowerCase();
            const searchTerm = compensationFilters.searchTerm.toLowerCase();

            if (!staffName.includes(searchTerm) && !deptName.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Staff Compensation Rates</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search staff or department..."
                                    className="pl-8 w-full sm:w-[250px]"
                                    value={compensationFilters.searchTerm}
                                    onChange={(e) => setCompensationFilters(prev => ({
                                        ...prev,
                                        searchTerm: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <Select
                                    value={compensationFilters.departmentId}
                                    onValueChange={(value) => setCompensationFilters(prev => ({
                                        ...prev,
                                        departmentId: value
                                    }))}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Departments</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="active-only" className="text-sm">Active Only</Label>
                                    <Switch
                                        id="active-only"
                                        checked={compensationFilters.active}
                                        onCheckedChange={(checked) => setCompensationFilters(prev => ({
                                            ...prev,
                                            active: checked
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingCompensationRates ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : filteredCompensationRates.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                                <DollarSign className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">No compensation rates found</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by adding your first compensation rate.
                            </p>
                            <Button onClick={() => {
                                setSelectedCompensationId(null);
                                setIsCompensationModalOpen(true);
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Compensation Rate
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Payment Type</TableHead>
                                        <TableHead className="text-right">Base Rate</TableHead>
                                        <TableHead className="text-right">Specialty Bonus</TableHead>
                                        <TableHead className="text-right">Exp. Multiplier</TableHead>
                                        <TableHead>Effective Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCompensationRates.map((rate) => {
                                        const isActive = rate.endDate ? new Date(rate.endDate) > new Date() : true;

                                        return (
                                            <TableRow key={rate.id} className={!isActive ? 'opacity-60' : ''}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {getStaffName(rate.staffProfileId)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getDepartmentName(rate.departmentId)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {getPaymentTypeLabel(rate.paymentType)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(parseFloat(rate.baseRate))}
                                                    {rate.paymentType === 'HOURLY' && <span className="text-xs text-muted-foreground ml-1">/hr</span>}
                                                    {rate.paymentType === 'WEEKLY' && <span className="text-xs text-muted-foreground ml-1">/wk</span>}
                                                    {rate.paymentType === 'MONTHLY' && <span className="text-xs text-muted-foreground ml-1">/mo</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {parseFloat(rate.specialtyBonus) > 0 ? (
                                                        <span className="text-green-600">
                                                            +{formatCurrency(parseFloat(rate.specialtyBonus))}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {rate.experienceMultiplier > 1 ? (
                                                        <span className="text-green-600">
                                                            {rate.experienceMultiplier.toFixed(1)}x
                                                        </span>
                                                    ) : (
                                                        <span>1.0x</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(rate.effectiveDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {rate.endDate ? (
                                                        new Date(rate.endDate).toLocaleDateString()
                                                    ) : (
                                                        <span className="text-muted-foreground">No end date</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Actions</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedCompensationId(rate.id);
                                                                setIsCompensationModalOpen(true);
                                                            }}>
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedCompensationId(rate.id);
                                                                setIsPremiumModalOpen(true);
                                                                setActiveTab('shift-premiums');
                                                            }}>
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Add Premium
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedCompensationId(rate.id);
                                                                    setIsDeleteCompensationModalOpen(true);
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Compensation Rate Modal */}
            <Dialog open={isCompensationModalOpen} onOpenChange={setIsCompensationModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCompensationId ? 'Edit Compensation Rate' : 'Create Compensation Rate'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCompensationId
                                ? 'Update the compensation rate details'
                                : 'Define the base compensation rate for a staff member'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="staffProfileId" className="required">Staff Member</Label>
                                <Select
                                    value={compensationForm.staffProfileId}
                                    onValueChange={(value) => setCompensationForm(prev => ({
                                        ...prev,
                                        staffProfileId: value
                                    }))}
                                    disabled={!!selectedCompensationId}
                                >
                                    <SelectTrigger id="staffProfileId">
                                        <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffProfiles?.users?.map(staff => (
                                            <SelectItem key={staff.id} value={staff.id}>
                                                {staff.firstName} {staff.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="departmentId" className="required">Department</Label>
                                <Select
                                    value={compensationForm.departmentId}
                                    onValueChange={(value) => setCompensationForm(prev => ({
                                        ...prev,
                                        departmentId: value
                                    }))}
                                    disabled={!!selectedCompensationId}
                                >
                                    <SelectTrigger id="departmentId">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentType" className="required">Payment Type</Label>
                            <RadioGroup
                                value={compensationForm.paymentType}
                                onValueChange={(value: PaymentType) =>
                                    setCompensationForm(prev => ({ ...prev, paymentType: value }))}
                                className="grid grid-cols-3 gap-4"
                            >
                                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                                    <RadioGroupItem value="HOURLY" id="hourly" />
                                    <Label htmlFor="hourly" className="flex flex-col cursor-pointer">
                                        <span>Hourly Rate</span>
                                        <span className="text-xs text-muted-foreground">Pay per hour worked</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                                    <RadioGroupItem value="WEEKLY" id="weekly" />
                                    <Label htmlFor="weekly" className="flex flex-col cursor-pointer">
                                        <span>Weekly Salary</span>
                                        <span className="text-xs text-muted-foreground">Fixed weekly amount</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent">
                                    <RadioGroupItem value="MONTHLY" id="monthly" />
                                    <Label htmlFor="monthly" className="flex flex-col cursor-pointer">
                                        <span>Monthly Salary</span>
                                        <span className="text-xs text-muted-foreground">Fixed monthly amount</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="baseRate" className="required">
                                Base {compensationForm.paymentType === 'HOURLY' ? 'Hourly ' : ''}
                                {compensationForm.paymentType === 'WEEKLY' ? 'Weekly ' : ''}
                                {compensationForm.paymentType === 'MONTHLY' ? 'Monthly ' : ''}
                                Rate
                            </Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="baseRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pl-8"
                                    value={compensationForm.baseRate}
                                    onChange={(e) => setCompensationForm(prev => ({
                                        ...prev,
                                        baseRate: parseFloat(e.target.value) || 0
                                    }))}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {compensationForm.paymentType === 'HOURLY' && 'Amount paid per hour worked'}
                                {compensationForm.paymentType === 'WEEKLY' && 'Fixed weekly salary, regardless of hours worked'}
                                {compensationForm.paymentType === 'MONTHLY' && 'Fixed monthly salary, regardless of hours worked'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="specialtyBonus">Specialty Bonus</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="specialtyBonus"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-8"
                                        value={compensationForm.specialtyBonus}
                                        onChange={(e) => setCompensationForm(prev => ({
                                            ...prev,
                                            specialtyBonus: parseFloat(e.target.value) || 0
                                        }))}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Additional amount for specialized roles or skills
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experienceMultiplier">Experience Multiplier</Label>
                                <Input
                                    id="experienceMultiplier"
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={compensationForm.experienceMultiplier}
                                    onChange={(e) => setCompensationForm(prev => ({
                                        ...prev,
                                        experienceMultiplier: parseFloat(e.target.value) || 1.0
                                    }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Multiplier applied based on experience (e.g., 1.2 = 20% increase)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveDate" className="required">Effective Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="effectiveDate"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !compensationForm.effectiveDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {compensationForm.effectiveDate ? format(new Date(compensationForm.effectiveDate), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={compensationForm.effectiveDate ? new Date(compensationForm.effectiveDate) : undefined}
                                            onSelect={(date) => setCompensationForm(prev => ({
                                                ...prev,
                                                effectiveDate: date ? date.toISOString().split('T')[0] : ''
                                            }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="endDate"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !compensationForm.endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {compensationForm.endDate ? format(new Date(compensationForm.endDate), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={compensationForm.endDate ? new Date(compensationForm.endDate) : undefined}
                                            onSelect={(date) => setCompensationForm(prev => ({
                                                ...prev,
                                                endDate: date ? date.toISOString().split('T')[0] : undefined
                                            }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <p className="text-xs text-muted-foreground">
                                    Leave empty for indefinite validity
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCompensationModalOpen(false);
                                if (selectedCompensationId) {
                                    setSelectedCompensationId(null);
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={selectedCompensationId ? handleUpdateCompensation : handleCreateCompensation}
                            disabled={
                                !compensationForm.staffProfileId ||
                                compensationForm.baseRate <= 0 ||
                                !compensationForm.effectiveDate ||
                                isCreatingCompensation ||
                                isUpdatingCompensation
                            }
                        >
                            {(isCreatingCompensation || isUpdatingCompensation) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {selectedCompensationId ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {selectedCompensationId ? 'Update' : 'Create'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Compensation Modal */}
            <Dialog open={isDeleteCompensationModalOpen} onOpenChange={setIsDeleteCompensationModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Compensation Rate</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this compensation rate? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCompensation && (
                        <div className="py-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                                <div className="font-medium flex items-center justify-between">
                                    <span>{getStaffName(selectedCompensation.staffProfileId)}</span>
                                    <Badge variant="outline">
                                        {getDepartmentName(selectedCompensation.departmentId)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <div className="flex justify-between">
                                        <span>{getPaymentTypeLabel(selectedCompensation.paymentType)}</span>
                                        <span className="font-medium">{formatCurrency(parseFloat(selectedCompensation.baseRate))}</span>
                                    </div>
                                    <div className="mt-1">
                                        Effective from: {new Date(selectedCompensation.effectiveDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-destructive">
                                <p>Warning: Deleting this rate will also remove all associated shift premiums.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteCompensationModalOpen(false);
                                setSelectedCompensationId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCompensation}
                            disabled={isDeletingCompensation}
                        >
                            {isDeletingCompensation ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CompensationRatesTab;