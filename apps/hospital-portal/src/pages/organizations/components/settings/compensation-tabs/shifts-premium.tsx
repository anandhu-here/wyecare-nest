import React, { useState } from 'react';
import {
    DollarSign,
    Search,
    Plus,
    Edit2,
    Trash2,
    Clock,
    Percent,
    Loader2,
    Save,
    MoreHorizontal,
    AlertCircle,
    CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';

// UI Components
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/util';

// API hooks
import {
    useShiftTypePremiumsControllerCreateMutation,
    useShiftTypePremiumsControllerFindAllQuery,
    useShiftTypePremiumsControllerRemoveMutation,
    useShiftTypePremiumsControllerUpdateMutation,
    useStaffCompensationRatesControllerFindAllQuery,
} from '@/features/generatedApi';

// Types from parent
import { PaymentType, PremiumFormValues, formatCurrency } from '../staff-compensation';

interface ShiftPremiumsTabProps {
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

const ShiftPremiumsTab = ({
    organizationId,
    staffProfiles,
    departments,
    shiftTypes,
    getStaffName,
    getDepartmentName,
    getShiftTypeName,
    getPaymentTypeLabel,
    setActiveTab
}: ShiftPremiumsTabProps) => {
    // Filter states
    const [premiumFilters, setPremiumFilters] = useState({
        shiftTypeId: '',
        compensationRateId: '',
        active: true,
        searchTerm: '',
    });

    // Modal states
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isDeletePremiumModalOpen, setIsDeletePremiumModalOpen] = useState(false);

    // Selected items for edit/delete
    const [selectedPremiumId, setSelectedPremiumId] = useState<string | null>(null);

    // Form states
    const [premiumForm, setPremiumForm] = useState<PremiumFormValues>({
        shiftTypeId: '',
        compensationRateId: '',
        isPremiumPercentage: true,
        premiumValue: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: undefined,
    });

    // Get compensation rates for dropdown in premium form
    const {
        data: compensationRates = []
    } = useStaffCompensationRatesControllerFindAllQuery({
        active: true,
        includePremiums: false,
    });

    // Shift premium queries
    const {
        data: shiftPremiums = [],
        isLoading: isLoadingShiftPremiums,
        refetch: refetchShiftPremiums,
    } = useShiftTypePremiumsControllerFindAllQuery({
        shiftTypeId: premiumFilters.shiftTypeId || undefined,
        compensationRateId: premiumFilters.compensationRateId || undefined,
        active: premiumFilters.active,
    });

    // Mutations
    const [createShiftPremium, { isLoading: isCreatingPremium }] =
        useShiftTypePremiumsControllerCreateMutation();

    const [updateShiftPremium, { isLoading: isUpdatingPremium }] =
        useShiftTypePremiumsControllerUpdateMutation();

    const [deleteShiftPremium, { isLoading: isDeletingPremium }] =
        useShiftTypePremiumsControllerRemoveMutation();

    // Handlers
    const handleCreatePremium = async () => {
        try {
            await createShiftPremium(premiumForm).unwrap();
            setIsPremiumModalOpen(false);
            setPremiumForm({
                shiftTypeId: '',
                compensationRateId: '',
                isPremiumPercentage: true,
                premiumValue: 0,
                effectiveDate: new Date().toISOString().split('T')[0],
                endDate: undefined,
            });

            await refetchShiftPremiums();
        } catch (error) {
            console.error('Failed to create shift premium:', error);
        }
    };

    const handleUpdatePremium = async () => {
        if (!selectedPremiumId) return;

        try {
            await updateShiftPremium({
                id: selectedPremiumId,
                updateDto: premiumForm
            }).unwrap();

            setIsPremiumModalOpen(false);
            setSelectedPremiumId(null);
            await refetchShiftPremiums();
        } catch (error) {
            console.error('Failed to update shift premium:', error);
        }
    };

    const handleDeletePremium = async () => {
        if (!selectedPremiumId) return;

        try {
            await deleteShiftPremium(selectedPremiumId).unwrap();
            setIsDeletePremiumModalOpen(false);
            setSelectedPremiumId(null);
            await refetchShiftPremiums();
        } catch (error) {
            console.error('Failed to delete shift premium:', error);
        }
    };

    // Filter functions
    const filteredShiftPremiums = shiftPremiums.filter(premium => {
        if (premiumFilters.searchTerm) {
            const shiftName = getShiftTypeName(premium.shiftTypeId).toLowerCase();
            const staffName = getStaffName(premium.compensationRate.staffProfileId).toLowerCase();
            const searchTerm = premiumFilters.searchTerm.toLowerCase();

            if (!shiftName.includes(searchTerm) && !staffName.includes(searchTerm)) {
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
                        <CardTitle>Shift Type Premiums</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search shifts or staff..."
                                    className="pl-8 w-full sm:w-[250px]"
                                    value={premiumFilters.searchTerm}
                                    onChange={(e) => setPremiumFilters(prev => ({
                                        ...prev,
                                        searchTerm: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <Select
                                    value={premiumFilters.shiftTypeId}
                                    onValueChange={(value) => setPremiumFilters(prev => ({
                                        ...prev,
                                        shiftTypeId: value
                                    }))}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Shift Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Shift Types</SelectItem>
                                        {shiftTypes.map(shift => (
                                            <SelectItem key={shift.id} value={shift.id}>
                                                {shift.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="premium-active-only" className="text-sm">Active Only</Label>
                                    <Switch
                                        id="premium-active-only"
                                        checked={premiumFilters.active}
                                        onCheckedChange={(checked) => setPremiumFilters(prev => ({
                                            ...prev,
                                            active: checked
                                        }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardDescription>
                        Shift premiums are additional payments for working specific shift types.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingShiftPremiums ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : filteredShiftPremiums.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex justify-center mb-4">
                                <Clock className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg mb-2">No shift premiums found</h3>
                            <p className="text-muted-foreground mb-4">
                                Create a premium to provide additional compensation for specific shift types.
                            </p>
                            {compensationRates.length > 0 ? (
                                <Button onClick={() => {
                                    setSelectedPremiumId(null);
                                    setIsPremiumModalOpen(true);
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Shift Premium
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveTab('base-compensation')}
                                >
                                    Create Base Compensation First
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Shift Type</TableHead>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Premium Type</TableHead>
                                        <TableHead className="text-right">Premium Value</TableHead>
                                        <TableHead>Effective Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredShiftPremiums.map((premium) => {
                                        const isActive = premium.endDate ? new Date(premium.endDate) > new Date() : true;

                                        return (
                                            <TableRow key={premium.id} className={!isActive ? 'opacity-60' : ''}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {getShiftTypeName(premium.shiftTypeId)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStaffName(premium.compensationRate.staffProfileId)}
                                                </TableCell>
                                                <TableCell>
                                                    {getDepartmentName(premium.compensationRate.departmentId)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={premium.isPremiumPercentage ? "default" : "secondary"}>
                                                        {premium.isPremiumPercentage ? 'Percentage' : 'Fixed Amount'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {premium.isPremiumPercentage ? (
                                                        <span className="text-green-600">
                                                            +{(parseFloat(premium.premiumValue) * 100).toFixed(0)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600">
                                                            +{formatCurrency(parseFloat(premium.premiumValue))}
                                                            {premium.compensationRate.paymentType === 'HOURLY' &&
                                                                <span className="text-xs ml-1">/hr</span>}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(premium.effectiveDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {premium.endDate ? (
                                                        new Date(premium.endDate).toLocaleDateString()
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
                                                                setPremiumForm({
                                                                    shiftTypeId: premium.shiftTypeId,
                                                                    compensationRateId: premium.compensationRateId,
                                                                    isPremiumPercentage: premium.isPremiumPercentage,
                                                                    premiumValue: parseFloat(premium.premiumValue),
                                                                    effectiveDate: new Date(premium.effectiveDate).toISOString().split('T')[0],
                                                                    endDate: premium.endDate
                                                                        ? new Date(premium.endDate).toISOString().split('T')[0]
                                                                        : undefined,
                                                                });
                                                                setSelectedPremiumId(premium.id);
                                                                setIsPremiumModalOpen(true);
                                                            }}>
                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setSelectedPremiumId(premium.id);
                                                                    setIsDeletePremiumModalOpen(true);
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

                    {filteredShiftPremiums.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedPremiumId(null);
                                    setIsPremiumModalOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Premium
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Shift Premium Modal */}
            <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPremiumId ? 'Edit Shift Premium' : 'Create Shift Premium'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPremiumId
                                ? 'Update the shift type premium details'
                                : 'Define additional compensation for working specific shift types'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="shiftTypeId" className="required">Shift Type</Label>
                                <Select
                                    value={premiumForm.shiftTypeId}
                                    onValueChange={(value) => setPremiumForm(prev => ({
                                        ...prev,
                                        shiftTypeId: value
                                    }))}
                                    disabled={!!selectedPremiumId}
                                >
                                    <SelectTrigger id="compensationRateId">
                                        <SelectValue placeholder="Select compensation rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {compensationRates.map(rate => (
                                            <SelectItem key={rate.id} value={rate.id}>
                                                {getStaffName(rate.staffProfileId)} ({getDepartmentName(rate.departmentId)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="required">Premium Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-accent ${premiumForm.isPremiumPercentage ? 'border-primary bg-accent' : ''}`}
                                    onClick={() => setPremiumForm(prev => ({ ...prev, isPremiumPercentage: true }))}
                                >
                                    <Percent className="h-4 w-4 mr-2" />
                                    <div>
                                        <div className="font-medium">Percentage</div>
                                        <div className="text-xs text-muted-foreground">
                                            Apply a percentage increase to the base rate
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-accent ${!premiumForm.isPremiumPercentage ? 'border-primary bg-accent' : ''}`}
                                    onClick={() => setPremiumForm(prev => ({ ...prev, isPremiumPercentage: false }))}
                                >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    <div>
                                        <div className="font-medium">Fixed Amount</div>
                                        <div className="text-xs text-muted-foreground">
                                            Add a fixed dollar amount to the base rate
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="premiumValue" className="required">
                                Premium Value
                                {premiumForm.isPremiumPercentage ? ' (%)' : ''}
                            </Label>
                            <div className="relative">
                                {premiumForm.isPremiumPercentage ? (
                                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                )}
                                <Input
                                    id="premiumValue"
                                    type="number"
                                    step={premiumForm.isPremiumPercentage ? "1" : "0.01"}
                                    min="0"
                                    className="pl-8"
                                    value={premiumForm.isPremiumPercentage ?
                                        premiumForm.premiumValue * 100 :
                                        premiumForm.premiumValue}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        setPremiumForm(prev => ({
                                            ...prev,
                                            premiumValue: premiumForm.isPremiumPercentage ? value / 100 : value
                                        }));
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {premiumForm.isPremiumPercentage
                                    ? 'Percentage added to the base rate (e.g., 25 = 25% extra)'
                                    : 'Fixed amount added to the base rate per hour/week/month'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="premium-effectiveDate" className="required">Effective Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="premium-effectiveDate"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !premiumForm.effectiveDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {premiumForm.effectiveDate ? format(new Date(premiumForm.effectiveDate), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={premiumForm.effectiveDate ? new Date(premiumForm.effectiveDate) : undefined}
                                            onSelect={(date) => setPremiumForm(prev => ({
                                                ...prev,
                                                effectiveDate: date ? date.toISOString().split('T')[0] : ''
                                            }))}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="premium-endDate">End Date (Optional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="premium-endDate"
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !premiumForm.endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {premiumForm.endDate ? format(new Date(premiumForm.endDate), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={premiumForm.endDate ? new Date(premiumForm.endDate) : undefined}
                                            onSelect={(date) => setPremiumForm(prev => ({
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
                                setIsPremiumModalOpen(false);
                                if (selectedPremiumId) {
                                    setSelectedPremiumId(null);
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={selectedPremiumId ? handleUpdatePremium : handleCreatePremium}
                            disabled={
                                !premiumForm.shiftTypeId ||
                                !premiumForm.compensationRateId ||
                                premiumForm.premiumValue <= 0 ||
                                !premiumForm.effectiveDate ||
                                isCreatingPremium ||
                                isUpdatingPremium
                            }
                        >
                            {(isCreatingPremium || isUpdatingPremium) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {selectedPremiumId ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {selectedPremiumId ? 'Update' : 'Create'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Premium Modal */}
            <Dialog open={isDeletePremiumModalOpen} onOpenChange={setIsDeletePremiumModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Delete Shift Premium</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this shift premium? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                Deleting this premium may affect payment calculations for past and future shifts.
                            </AlertDescription>
                        </Alert>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeletePremiumModalOpen(false);
                                setSelectedPremiumId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeletePremium}
                            disabled={isDeletingPremium}
                        >
                            {isDeletingPremium ? (
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

export default ShiftPremiumsTab;