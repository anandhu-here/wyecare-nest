"use client"

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { format, parseISO, set } from 'date-fns'
import { toast } from 'react-toastify'

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

// Icons
import {
    AlarmClock,
    AlertCircle,
    Calendar,
    Clock,
    Copy,
    Edit,
    EllipsisVertical,
    FileClock,
    FilePlus,
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
} from 'lucide-react'

// Redux selectors and API hooks
import { selectCurrentOrganization } from '@/features/auth/authSlice'
import {
    useCreateShiftTypeMutation,
    useFindShiftTypesByOrganizationQuery,
    useUpdateShiftTypeMutation,
    useRemoveShiftTypeMutation,
    useCloneShiftTypeMutation,
    ShiftType,
    CreateShiftTypeDto,
    UpdateShiftTypeDto
} from '@/features/shifts/shiftsApi'

// Helper function to convert date objects to time strings for form inputs
const formatTimeForInput = (date: Date | string | null | undefined): string => {
    if (!date) return ''
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'HH:mm')
}

// Helper function to convert time strings to Date objects
const parseTimeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return set(new Date(), { hours, minutes, seconds: 0, milliseconds: 0 })
}

// Calculate hours between two time values
const calculateHours = (startTime: string, endTime: string, isOvernight: boolean): number => {
    const start = parseTimeToDate(startTime)
    const end = parseTimeToDate(endTime)

    let diffMs = end.getTime() - start.getTime()

    // If overnight shift, add 24 hours to the difference
    if (isOvernight && diffMs <= 0) {
        diffMs += 24 * 60 * 60 * 1000
    }

    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
}

const ShiftSettingsPage = () => {
    const [activeTab, setActiveTab] = useState("shift-types")
    const currentOrganization = useSelector(selectCurrentOrganization)

    // Shift Type management
    const [isAddShiftTypeOpen, setIsAddShiftTypeOpen] = useState(false)
    const [isEditShiftTypeOpen, setIsEditShiftTypeOpen] = useState(false)
    const [currentShiftType, setCurrentShiftType] = useState<ShiftType | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form state for creating/editing shift types
    const [shiftTypeForm, setShiftTypeForm] = useState<{
        name: string;
        startTime: string;
        endTime: string;
        isOvernight: boolean;
        basePayMultiplier: number;
        description: string;
    }>({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        isOvernight: false,
        basePayMultiplier: 1.0,
        description: '',
    })

    // RTK Query hooks
    const [createShiftType, { isLoading: isCreatingShiftType }] = useCreateShiftTypeMutation()
    const [updateShiftType, { isLoading: isUpdatingShiftType }] = useUpdateShiftTypeMutation()
    const [removeShiftType, { isLoading: isRemovingShiftType }] = useRemoveShiftTypeMutation()
    const [cloneShiftType, { isLoading: isCloningShiftType }] = useCloneShiftTypeMutation()

    const {
        data: shiftTypes,
        isLoading: isLoadingShiftTypes,
        refetch: refetchShiftTypes
    } = useFindShiftTypesByOrganizationQuery(currentOrganization?.id || '')

    // Filtered shift types based on search term
    const filteredShiftTypes = shiftTypes?.filter(
        (shiftType) => shiftType.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Handle form changes
    const handleShiftTypeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setShiftTypeForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleToggleChange = (checked: boolean) => {
        setShiftTypeForm((prev) => ({
            ...prev,
            isOvernight: checked,
        }))
    }

    // Calculate hours count when start/end time changes
    useEffect(() => {
        if (shiftTypeForm.startTime && shiftTypeForm.endTime) {
            const hoursCount = calculateHours(
                shiftTypeForm.startTime,
                shiftTypeForm.endTime,
                shiftTypeForm.isOvernight
            )

            // Don't update the form state here since we're calculating it dynamically
            // We'll use this value when submitting the form
        }
    }, [shiftTypeForm.startTime, shiftTypeForm.endTime, shiftTypeForm.isOvernight])

    // Open add shift type dialog
    const handleAddShiftType = () => {
        setShiftTypeForm({
            name: '',
            startTime: '09:00',
            endTime: '17:00',
            isOvernight: false,
            basePayMultiplier: 1.0,
            description: '',
        })
        setIsAddShiftTypeOpen(true)
    }

    // Open edit shift type dialog
    const handleEditShiftType = (shiftType: ShiftType) => {
        setCurrentShiftType(shiftType)
        setShiftTypeForm({
            name: shiftType.name,
            startTime: formatTimeForInput(shiftType.startTime),
            endTime: formatTimeForInput(shiftType.endTime),
            isOvernight: shiftType.isOvernight,
            basePayMultiplier: shiftType.basePayMultiplier,
            description: shiftType.description || '',
        })
        setIsEditShiftTypeOpen(true)
    }

    // Open delete confirmation dialog
    const handleDeleteClick = (shiftType: ShiftType) => {
        setCurrentShiftType(shiftType)
        setDeleteConfirmOpen(true)
    }

    // Clone shift type
    const handleCloneShiftType = async (shiftType: ShiftType) => {
        if (!currentOrganization?.id) return

        try {
            await cloneShiftType({
                id: shiftType.id,
                updateData: {
                    name: `${shiftType.name} (Copy)`,
                    organizationId: currentOrganization.id,
                }
            }).unwrap()

            toast.success(`Shift type "${shiftType.name}" cloned successfully`)
            refetchShiftTypes()
        } catch (error) {
            toast.error(`Failed to clone shift type: ${error.data?.message || error.message}`)
        }
    }

    // Create new shift type
    const handleCreateShiftType = async () => {
        if (!currentOrganization?.id) return

        const hoursCount = calculateHours(
            shiftTypeForm.startTime,
            shiftTypeForm.endTime,
            shiftTypeForm.isOvernight
        )

        try {
            const newShiftType: CreateShiftTypeDto = {
                name: shiftTypeForm.name,
                startTime: parseTimeToDate(shiftTypeForm.startTime),
                endTime: parseTimeToDate(shiftTypeForm.endTime),
                isOvernight: shiftTypeForm.isOvernight,
                hoursCount,
                basePayMultiplier: shiftTypeForm.basePayMultiplier,
                description: shiftTypeForm.description,
                organizationId: currentOrganization.id,
            }

            await createShiftType(newShiftType).unwrap()
            toast.success(`Shift type "${shiftTypeForm.name}" created successfully`)
            setIsAddShiftTypeOpen(false)
            refetchShiftTypes()
        } catch (error) {
            toast.error(`Failed to create shift type: ${error.data?.message || error.message}`)
        }
    }

    // Update existing shift type
    const handleUpdateShiftType = async () => {
        if (!currentShiftType || !currentOrganization?.id) return

        const hoursCount = calculateHours(
            shiftTypeForm.startTime,
            shiftTypeForm.endTime,
            shiftTypeForm.isOvernight
        )

        try {
            const updatedShiftType: UpdateShiftTypeDto = {
                name: shiftTypeForm.name,
                startTime: parseTimeToDate(shiftTypeForm.startTime),
                endTime: parseTimeToDate(shiftTypeForm.endTime),
                isOvernight: shiftTypeForm.isOvernight,
                hoursCount,
                basePayMultiplier: shiftTypeForm.basePayMultiplier,
                description: shiftTypeForm.description,
            }

            await updateShiftType({
                id: currentShiftType.id,
                updateShiftTypeDto: updatedShiftType
            }).unwrap()

            toast.success(`Shift type "${shiftTypeForm.name}" updated successfully`)
            setIsEditShiftTypeOpen(false)
            refetchShiftTypes()
        } catch (error) {
            toast.error(`Failed to update shift type: ${error.data?.message || error.message}`)
        }
    }

    // Delete shift type
    const handleDeleteShiftType = async () => {
        if (!currentShiftType) return

        try {
            await removeShiftType(currentShiftType.id).unwrap()
            toast.success(`Shift type "${currentShiftType.name}" deleted successfully`)
            setDeleteConfirmOpen(false)
            refetchShiftTypes()
        } catch (error) {
            toast.error(`Failed to delete shift type: ${error.data?.message || error.message}`)
        }
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <Tabs
                defaultValue="shift-types"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full flex flex-col h-full overflow-hidden"
            >
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="grid w-[400px] grid-cols-2">
                        <TabsTrigger value="shift-types" className="flex items-center gap-2">
                            <FileClock className="h-4 w-4" />
                            Shift Types
                        </TabsTrigger>
                        <TabsTrigger value="compensation" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Compensation Settings
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "shift-types" && (
                        <Button onClick={handleAddShiftType} className="gap-1">
                            <Plus className="h-4 w-4" />
                            Add Shift Type
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden">
                    {/* Shift Types Tab */}
                    <TabsContent
                        value="shift-types"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <Card className="h-full flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl">Shift Types</CardTitle>
                                        <CardDescription>
                                            Configure the shift types for your organization's schedule
                                        </CardDescription>
                                    </div>
                                </div>

                                {/* Search and filter */}
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search shift types..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-hidden p-0">
                                <div className="border rounded-md h-full overflow-hidden">
                                    {isLoadingShiftTypes ? (
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
                                        <ScrollArea className="h-full">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Schedule</TableHead>
                                                        <TableHead>Hours</TableHead>
                                                        <TableHead>Pay Multiplier</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredShiftTypes && filteredShiftTypes.length > 0 ? (
                                                        filteredShiftTypes.map((shiftType) => (
                                                            <TableRow key={shiftType.id}>
                                                                <TableCell className="font-medium">
                                                                    <div className="flex flex-col">
                                                                        {shiftType.name}
                                                                        {shiftType.isOvernight && (
                                                                            <Badge variant="outline" className="w-fit mt-1 bg-blue-50 text-blue-700 border-blue-200">
                                                                                <MoonStar className="mr-1 h-3 w-3" />
                                                                                Overnight
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center">
                                                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <span>
                                                                            {formatTimeForInput(shiftType.startTime)} - {formatTimeForInput(shiftType.endTime)}
                                                                        </span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>{shiftType.hoursCount} hrs</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                        {shiftType.basePayMultiplier}x
                                                                    </Badge>
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
                                                                            <DropdownMenuItem onClick={() => handleEditShiftType(shiftType)}>
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => handleCloneShiftType(shiftType)}>
                                                                                <Copy className="mr-2 h-4 w-4" />
                                                                                Clone
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-destructive focus:text-destructive"
                                                                                onClick={() => handleDeleteClick(shiftType)}
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
                                                            <TableCell colSpan={5} className="h-24 text-center">
                                                                {searchTerm ? (
                                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                                        <Search className="h-8 w-8 mb-2" />
                                                                        <p>No shift types matching "{searchTerm}"</p>
                                                                        <p className="text-sm">Try a different search term</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                                        <FileClock className="h-8 w-8 mb-2" />
                                                                        <p>No shift types defined yet</p>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="mt-2"
                                                                            onClick={handleAddShiftType}
                                                                        >
                                                                            <Plus className="mr-1 h-4 w-4" />
                                                                            Add your first shift type
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Compensation Settings Tab */}
                    <TabsContent
                        value="compensation"
                        className="h-full flex-1 overflow-hidden mt-0 border-0 p-0"
                    >
                        <Card className="h-full flex flex-col overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl">Compensation Settings</CardTitle>
                                <CardDescription>
                                    Configure pay rates and compensation rules for different shift types
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-5 overflow-auto">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Compensation settings configuration</AlertTitle>
                                    <AlertDescription>
                                        This section will allow you to configure compensation rates for staff by department,
                                        specialty, and shift type. This feature is under development.
                                    </AlertDescription>
                                </Alert>

                                {/* Placeholder for future compensation settings */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Default Multipliers</CardTitle>
                                        <CardDescription>
                                            Set default pay multipliers for specific situations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="night-multiplier">Night Shift Multiplier</Label>
                                                <Input
                                                    id="night-multiplier"
                                                    type="number"
                                                    placeholder="1.25"
                                                    min="1"
                                                    step="0.05"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="weekend-multiplier">Weekend Multiplier</Label>
                                                <Input
                                                    id="weekend-multiplier"
                                                    type="number"
                                                    placeholder="1.5"
                                                    min="1"
                                                    step="0.05"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="holiday-multiplier">Holiday Multiplier</Label>
                                                <Input
                                                    id="holiday-multiplier"
                                                    type="number"
                                                    placeholder="2.0"
                                                    min="1"
                                                    step="0.05"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="overtime-multiplier">Overtime Multiplier</Label>
                                                <Input
                                                    id="overtime-multiplier"
                                                    type="number"
                                                    placeholder="1.5"
                                                    min="1"
                                                    step="0.05"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Add Shift Type Dialog */}
            <Dialog open={isAddShiftTypeOpen} onOpenChange={setIsAddShiftTypeOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Shift Type</DialogTitle>
                        <DialogDescription>
                            Create a new shift type for scheduling
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Shift Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Morning Shift, Night Shift"
                                value={shiftTypeForm.name}
                                onChange={handleShiftTypeFormChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    value={shiftTypeForm.startTime}
                                    onChange={handleShiftTypeFormChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    value={shiftTypeForm.endTime}
                                    onChange={handleShiftTypeFormChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isOvernight" className="flex items-center space-x-2 cursor-pointer">
                                    <MoonStar className="h-4 w-4 text-muted-foreground" />
                                    <span>Overnight Shift</span>
                                </Label>
                                <Switch
                                    id="isOvernight"
                                    checked={shiftTypeForm.isOvernight}
                                    onCheckedChange={handleToggleChange}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enable if the shift spans across midnight
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="basePayMultiplier">Pay Multiplier</Label>
                            <Input
                                id="basePayMultiplier"
                                name="basePayMultiplier"
                                type="number"
                                step="0.1"
                                min="1"
                                value={shiftTypeForm.basePayMultiplier}
                                onChange={handleShiftTypeFormChange}
                            />
                            <p className="text-sm text-muted-foreground">
                                Multiplier applied to base pay rate (e.g., 1.5 for time-and-a-half)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Add details about this shift type"
                                rows={3}
                                value={shiftTypeForm.description}
                                onChange={handleShiftTypeFormChange}
                            />
                        </div>

                        <div className="bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center space-x-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Shift Duration:</p>
                                <Badge variant="outline">
                                    {calculateHours(
                                        shiftTypeForm.startTime,
                                        shiftTypeForm.endTime,
                                        shiftTypeForm.isOvernight
                                    )} hours
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddShiftTypeOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateShiftType}
                            disabled={!shiftTypeForm.name || !shiftTypeForm.startTime || !shiftTypeForm.endTime || isCreatingShiftType}
                        >
                            {isCreatingShiftType ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Shift Type
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Shift Type Dialog */}
            <Dialog open={isEditShiftTypeOpen} onOpenChange={setIsEditShiftTypeOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Shift Type</DialogTitle>
                        <DialogDescription>
                            Update the details for this shift type
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Shift Name</Label>
                            <Input
                                id="edit-name"
                                name="name"
                                placeholder="e.g., Morning Shift, Night Shift"
                                value={shiftTypeForm.name}
                                onChange={handleShiftTypeFormChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-startTime">Start Time</Label>
                                <Input
                                    id="edit-startTime"
                                    name="startTime"
                                    type="time"
                                    value={shiftTypeForm.startTime}
                                    onChange={handleShiftTypeFormChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-endTime">End Time</Label>
                                <Input
                                    id="edit-endTime"
                                    name="endTime"
                                    type="time"
                                    value={shiftTypeForm.endTime}
                                    onChange={handleShiftTypeFormChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="edit-isOvernight" className="flex items-center space-x-2 cursor-pointer">
                                    <MoonStar className="h-4 w-4 text-muted-foreground" />
                                    <span>Overnight Shift</span>
                                </Label>
                                <Switch
                                    id="edit-isOvernight"
                                    checked={shiftTypeForm.isOvernight}
                                    onCheckedChange={handleToggleChange}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Enable if the shift spans across midnight
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-basePayMultiplier">Pay Multiplier</Label>
                            <Input
                                id="edit-basePayMultiplier"
                                name="basePayMultiplier"
                                type="number"
                                step="0.1"
                                min="1"
                                value={shiftTypeForm.basePayMultiplier}
                                onChange={handleShiftTypeFormChange}
                            />
                            <p className="text-sm text-muted-foreground">
                                Multiplier applied to base pay rate (e.g., 1.5 for time-and-a-half)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                                id="edit-description"
                                name="description"
                                placeholder="Add details about this shift type"
                                rows={3}
                                value={shiftTypeForm.description}
                                onChange={handleShiftTypeFormChange}
                            />
                        </div>

                        <div className="bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center space-x-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Shift Duration:</p>
                                <Badge variant="outline">
                                    {calculateHours(
                                        shiftTypeForm.startTime,
                                        shiftTypeForm.endTime,
                                        shiftTypeForm.isOvernight
                                    )} hours
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditShiftTypeOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateShiftType}
                            disabled={!shiftTypeForm.name || !shiftTypeForm.startTime || !shiftTypeForm.endTime || isUpdatingShiftType}
                        >
                            {isUpdatingShiftType ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Shift Type
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Shift Type</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this shift type? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {currentShiftType && (
                        <div className="py-4">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                                <div className="font-medium text-destructive">{currentShiftType.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center mt-1">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {formatTimeForInput(currentShiftType.startTime)} - {formatTimeForInput(currentShiftType.endTime)}
                                </div>
                            </div>

                            <div className="text-sm text-destructive">
                                <p>Warning: If this shift type is used in any schedules, those references will be affected.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteShiftType}
                            disabled={isRemovingShiftType}
                        >
                            {isRemovingShiftType ? (
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
        </div>
    )
}

export default ShiftSettingsPage