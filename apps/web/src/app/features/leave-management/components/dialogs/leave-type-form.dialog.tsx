import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LeaveTimeUnit } from '@wyecare-monorepo/shared-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Define the form schema with Zod
const leaveTypeSchema = z.object({
    name: z.string().min(1, 'Leave type name is required'),
    type: z.string().min(1, 'Leave type category is required'),
    description: z.string().optional(),
    allowedTimeUnits: z.array(z.string()).min(1, 'At least one time unit must be selected'),
    entitlementAmount: z.number().min(0.1, 'Entitlement amount must be greater than zero'),
    defaultTimeUnit: z.string().min(1, 'Default time unit is required'),
    isProratedForNewJoiners: z.boolean().default(true),
    prorationMethod: z.enum(['daily', 'monthly', 'quarterly']).default('monthly'),
    accrualEnabled: z.boolean().default(false),
    accrualFrequency: z.string().optional(),
    accrualMethod: z.string().optional(),
    accrualAmount: z.number().optional(),
    accrualTimeUnit: z.string().optional(),
    maxAccrualAmount: z.number().optional(),
    requiresApproval: z.boolean().default(true),
    allowPartialTimeUnit: z.boolean().default(true),
    minimumPartialAmount: z.number().optional(),
    partialTimeIncrement: z.number().optional(),
    allowCarryOver: z.boolean().default(false),
    carryOverLimit: z.number().optional(),
    carryOverTimeUnit: z.string().optional(),
    carryOverExpiryMonths: z.number().optional(),
    countsTowardsServiceTime: z.boolean().default(true),
    affectsPerformanceCalculation: z.boolean().default(true),
    color: z.string().optional(),
    displayOrder: z.number().optional(),
});

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

interface LeaveTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<LeaveTypeFormValues>;
    onSave: (data: LeaveTypeFormValues) => void;
    isEditing?: boolean;
}

const timeUnitOptions = [
    { label: 'Hours', value: LeaveTimeUnit.HOURS },
    { label: 'Days', value: LeaveTimeUnit.DAYS },
    { label: 'Weeks', value: LeaveTimeUnit.WEEKS },
];

const prorationOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
];

const accrualFrequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Biweekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annually', value: 'annually' },
];

const accrualMethodOptions = [
    { label: 'Immediate', value: 'immediate' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Progressive', value: 'progressive' },
    { label: 'Anniversary', value: 'anniversary' },
];

export function LeaveTypeDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
    isEditing = false,
}: LeaveTypeDialogProps) {
    const defaultValues: Partial<LeaveTypeFormValues> = {
        name: '',
        type: '',
        description: '',
        allowedTimeUnits: [LeaveTimeUnit.DAYS],
        entitlementAmount: 0,
        defaultTimeUnit: LeaveTimeUnit.DAYS,
        isProratedForNewJoiners: true,
        prorationMethod: 'monthly',
        accrualEnabled: false,
        requiresApproval: true,
        allowPartialTimeUnit: true,
        allowCarryOver: false,
        countsTowardsServiceTime: true,
        affectsPerformanceCalculation: true,
        ...initialData,
    };

    const form = useForm<LeaveTypeFormValues>({
        resolver: zodResolver(leaveTypeSchema),
        defaultValues,
    });

    const accrualEnabled = form.watch('accrualEnabled');
    const allowCarryOver = form.watch('allowCarryOver');
    const allowPartialTimeUnit = form.watch('allowPartialTimeUnit');

    const onSubmit = (data: LeaveTypeFormValues) => {
        onSave(data);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Leave Type' : 'Add New Leave Type'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid grid-cols-4 mb-4">
                                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                                <TabsTrigger value="accrual">Accrual Settings</TabsTrigger>
                                <TabsTrigger value="partial">Partial Leave</TabsTrigger>
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                            </TabsList>

                            {/* Basic Details Tab */}
                            <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Leave Type Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Annual Leave" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Vacation, Sick, etc." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Standard annual leave allowance" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="entitlementAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entitlement Amount *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="defaultTimeUnit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Default Time Unit *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select time unit" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {timeUnitOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="allowedTimeUnits"
                                    render={() => (
                                        <FormItem>
                                            <div className="mb-2">
                                                <FormLabel>Allowed Time Units *</FormLabel>
                                            </div>
                                            <div className="flex flex-row gap-4">
                                                {timeUnitOptions.map((option) => (
                                                    <FormField
                                                        key={option.value}
                                                        control={form.control}
                                                        name="allowedTimeUnits"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={option.value}
                                                                    className="flex flex-row items-start space-x-2 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(option.value)}
                                                                            onCheckedChange={(checked) => {
                                                                                const updatedValue = checked
                                                                                    ? [...field.value, option.value]
                                                                                    : field.value?.filter((value) => value !== option.value);
                                                                                field.onChange(updatedValue);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">
                                                                        {option.label}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center space-x-2">
                                    <FormField
                                        control={form.control}
                                        name="requiresApproval"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Requires Approval</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <div className="mb-4">
                                        <h3 className="text-md font-semibold">Pro-Rating Settings</h3>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <FormField
                                            control={form.control}
                                            name="isProratedForNewJoiners"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel>Pro-rated for New Joiners</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {form.watch('isProratedForNewJoiners') && (
                                        <FormField
                                            control={form.control}
                                            name="prorationMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pro-ration Method</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {prorationOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            </TabsContent>

                            {/* Accrual Settings Tab */}
                            <TabsContent value="accrual" className="space-y-4">
                                <div className="flex items-center space-x-2 mb-4">
                                    <FormField
                                        control={form.control}
                                        name="accrualEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Enable Accrual</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {accrualEnabled && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="accrualFrequency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Accrual Frequency</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select frequency" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {accrualFrequencyOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="accrualMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Accrual Method</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {accrualMethodOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="accrualAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Accrual Amount</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="accrualTimeUnit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Accrual Time Unit</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select time unit" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {timeUnitOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="maxAccrualAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Maximum Accrual Amount</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Leave blank for unlimited
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            {/* Partial Leave Tab */}
                            <TabsContent value="partial" className="space-y-4">
                                <div className="flex items-center space-x-2 mb-4">
                                    <FormField
                                        control={form.control}
                                        name="allowPartialTimeUnit"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Allow Partial Day/Hour Leave</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {allowPartialTimeUnit && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="minimumPartialAmount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Minimum Partial Amount</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="partialTimeIncrement"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Partial Time Increment</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        E.g., 0.5 for half-day, 0.25 for quarter-day
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            {/* Advanced Settings Tab */}
                            <TabsContent value="advanced" className="space-y-4">
                                <div className="flex items-center space-x-2 mb-4">
                                    <FormField
                                        control={form.control}
                                        name="allowCarryOver"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Allow Carry Over</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {allowCarryOver && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="carryOverLimit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Carry Over Limit</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.5"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="carryOverTimeUnit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Carry Over Time Unit</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select time unit" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {timeUnitOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="carryOverExpiryMonths"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Carry Over Expiry (Months)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="12"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        How many months before carried leave expires
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                <Separator className="my-4" />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="countsTowardsServiceTime"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Counts Towards Service Time</FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="affectsPerformanceCalculation"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel>Affects Performance Calculation</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <div className="flex">
                                                <Input
                                                    type="color"
                                                    className="w-12 h-10 p-1"
                                                    {...field}
                                                />
                                                <Input
                                                    type="text"
                                                    className="ml-2 flex-1"
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                />
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="displayOrder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Order</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Lower numbers display first
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {isEditing ? 'Update' : 'Add'} Leave Type
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default LeaveTypeDialog;